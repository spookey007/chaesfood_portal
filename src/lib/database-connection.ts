import type { PoolConfig } from "pg";

/**
 * Normalize connection strings for `pg` + Prisma adapter.
 * - Trims whitespace (common .env mistake)
 * - `postgres://` → `postgresql://`
 * - On Vercel: append `connect_timeout` if missing (same idea as Mizan `apps/api/src/env.ts`)
 *
 * We do **not** append `sslmode=require` here. Current `pg` / `pg-connection-string` treats
 * `require` like strict verification, which surfaces “self‑signed certificate in certificate chain”
 * for some Supabase / pooler setups while Navicat and Prisma 6’s engine still connect. Use the
 * URI exactly as your host dashboard gives it (`sslmode`, `channel_binding`, etc.).
 */
export function normalizePostgresUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  if (url.startsWith("postgres://")) {
    url = `postgresql://${url.slice("postgres://".length)}`;
  }
  try {
    const u = new URL(url);
    if (process.env.VERCEL === "1" && !u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", "12");
    }
    applySupabasePoolerCompat(u);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Supabase **transaction pooler** (PgBouncer / Supavisor, usually port 6543) + `pg` often fails SCRAM
 * with P1000 while Navicat (direct 5432 or different auth path) still works. Disabling channel
 * binding matches what many hosted dashboards append; safe to set when absent.
 *
 * @see https://github.com/orgs/supabase/discussions (pooler auth / SCRAM threads)
 */
function applySupabasePoolerCompat(u: URL): void {
  const host = u.hostname.toLowerCase();
  const port = u.port || "5432";
  const onSupabasePooler =
    host.includes("pooler.supabase.com") || (host.endsWith(".supabase.co") && port === "6543");
  if (!onSupabasePooler) return;
  if (!u.searchParams.has("channel_binding")) {
    u.searchParams.set("channel_binding", "disable");
  }
}

/** Redacted line for logs (never prints password). */
export function redactedPostgresUrlForLog(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    const user = u.username ? decodeURIComponent(u.username) : "";
    return `postgresql://${user || "?"}:***@${u.hostname}:${u.port || "5432"}${u.pathname}${u.search}`;
  } catch {
    return "(invalid DATABASE_URL — check quoting / special characters in password)";
  }
}

let warnedPoolerUser = false;

/** One-time dev hint when pooler host is used with bare `postgres` user (often wrong for transaction mode). */
export function warnSupabasePoolerUsernameIfLikelyMisconfigured(connectionString: string): void {
  if (process.env.NODE_ENV === "production" || warnedPoolerUser) return;
  try {
    const u = new URL(connectionString);
    const host = u.hostname.toLowerCase();
    if (!host.includes("pooler.supabase.com")) return;
    const user = decodeURIComponent(u.username || "");
    if (user !== "postgres") return;
    warnedPoolerUser = true;
    console.warn(
      "[db] Supabase transaction pooler detected with DB user `postgres`. If auth fails (P1000) but Navicat works, " +
        "copy the pooler URI from the Supabase dashboard (user is usually `postgres.<project_ref>`) " +
        "or use Session/direct URI from the dashboard in `DATABASE_URL`. Current URL (redacted):",
      redactedPostgresUrlForLog(connectionString),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Options for `new Pool(...)` shared by the Next.js server and CLI scripts.
 */
export function getPgPoolOptions(connectionString: string): PoolConfig {
  const normalized = normalizePostgresUrl(connectionString);
  const config: PoolConfig = {
    connectionString: normalized,
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 25_000),
    max: Number(process.env.DATABASE_POOL_MAX ?? 15),
    idleTimeoutMillis: 30_000,
  };

  // Applies to Neon, Supabase, self‑signed / corporate CA chains, etc. (Previously this was
  // mistakenly gated on Supabase-only hostnames, so the env var had no effect elsewhere.)
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

/**
 * Postgres URL for the **running Next.js app** (API routes, RSC, auth).
 * Single env var: `DATABASE_URL` (Neon, Supabase, etc.).
 */
export function getAppDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Required for Prisma + pg at runtime — see .env.example.");
  }
  return normalizePostgresUrl(raw);
}

type DbDevLogGlobals = { __chaesfoodDbDevBootstrapLogged?: boolean };

function dbDevGlobals(): DbDevLogGlobals {
  return globalThis as DbDevLogGlobals;
}

/**
 * Dev-only: prints **redacted** DB-related env and where connections are created.
 * Set `DATABASE_DEBUG=0` in `.env` to silence. Production never logs.
 */
export function logDevDatabaseBootstrap(resolvedNormalizedUrl: string, event: "init" | "reload"): void {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.DATABASE_DEBUG === "0") return;

  const redact = (name: string) => {
    const raw = process.env[name]?.trim();
    if (!raw) return "(unset)";
    try {
      return redactedPostgresUrlForLog(normalizePostgresUrl(raw));
    } catch {
      return "(set, could not parse as URL)";
    }
  };

  if (event === "reload") {
    console.info("[db] Pool + Prisma client recreated (env URL changed).");
    console.info("[db] Effective app connection (redacted):", redactedPostgresUrlForLog(resolvedNormalizedUrl));
    console.info("[db] Env key: DATABASE_URL");
    return;
  }

  if (dbDevGlobals().__chaesfoodDbDevBootstrapLogged) return;
  dbDevGlobals().__chaesfoodDbDevBootstrapLogged = true;

  console.info(`[db] Where PostgreSQL is opened (this repo)
  • Next.js (RSC, Route Handlers, Auth): src/lib/prisma.ts → new Pool() + PrismaPg adapter
  • URL normalization + pool TLS/pooler tweaks: src/lib/database-connection.ts
  • Prisma CLI (migrate, etc.) datasource URL: prisma.config.ts
  • npm run db:seed: prisma/seed.ts
  • npm run db:sync-products: prisma/sync-products.ts
  (Both CLIs use getCliDatabaseUrl() + getPgPoolOptions() from src/lib/database-connection.ts)`);

  console.info("[db] Env snapshot (passwords never shown; URLs redacted):", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ?? "(unset)",
    DATABASE_URL: redact("DATABASE_URL"),
    DATABASE_SSL_REJECT_UNAUTHORIZED: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "(unset)",
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX ?? "(default 15)",
    DATABASE_CONNECT_TIMEOUT_MS: process.env.DATABASE_CONNECT_TIMEOUT_MS ?? "(default 25000)",
    DATABASE_DEBUG: process.env.DATABASE_DEBUG ?? "(unset; use DATABASE_DEBUG=0 to silence these logs)",
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? "(unset)",
    AUTH_SECRET: process.env.AUTH_SECRET ? "(set)" : "(unset — required for Auth.js)",
  });

  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
    console.warn(
      "[db] NODE_TLS_REJECT_UNAUTHORIZED=0 disables TLS verification for the whole Node process (not just Postgres). Prefer fixing DATABASE_URL or DATABASE_SSL_REJECT_UNAUTHORIZED=false for DB only.",
    );
  }

  console.info("[db] Effective app connection after normalize (redacted):", redactedPostgresUrlForLog(resolvedNormalizedUrl));
}

/**
 * Dev / local CLI: one line when `db:seed` or `db:sync-products` opens Postgres (not the Next.js app).
 */
export function logDevCliDatabaseContext(resolvedNormalizedUrl: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.DATABASE_DEBUG === "0") return;
  console.info("[db] CLI connection via getCliDatabaseUrl() → DATABASE_URL only");
  console.info("[db] Effective CLI connection (redacted):", redactedPostgresUrlForLog(resolvedNormalizedUrl));
}

/**
 * Postgres URL for **migrations and seed/sync** CLIs — same as the app: `DATABASE_URL` only.
 */
export function getCliDatabaseUrl(): string {
  return getAppDatabaseUrl();
}
