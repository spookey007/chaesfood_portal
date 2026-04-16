const MAX_CHECKOUT_BODY_BYTES = 100_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function normalizeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function allowedCheckoutOrigins(): string[] {
  const bases = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((x): x is string => Boolean(x));

  return [...new Set(bases.map(normalizeOrigin).filter(Boolean))];
}

/** Reject oversized bodies before parsing JSON (defense in depth). */
export function checkoutBodyTooLarge(request: Request): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > MAX_CHECKOUT_BODY_BYTES;
}

export function assertCheckoutOrigin(request: Request): { ok: true } | { ok: false; status: number; message: string } {
  const origin = request.headers.get("origin");
  if (!origin) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, status: 403, message: "Missing Origin header." };
    }
    return { ok: true };
  }

  const o = normalizeOrigin(origin);
  if (!o) {
    return { ok: false, status: 403, message: "Invalid Origin." };
  }

  const allowed = allowedCheckoutOrigins();
  if (allowed.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true };
    }
    return { ok: false, status: 503, message: "Checkout is not configured (set AUTH_URL or NEXT_PUBLIC_APP_URL)." };
  }

  if (allowed.includes(o)) {
    return { ok: true };
  }

  return { ok: false, status: 403, message: "Forbidden origin." };
}

export function checkoutClientFingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 160);
  return `${ip}:${ua}`;
}

/** Returns false when rate limited (sliding window per fingerprint). */
export function checkoutRateLimitAllow(key: string): boolean {
  const now = Date.now();
  const cur = rateBuckets.get(key);
  if (!cur || now > cur.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (cur.count >= RATE_MAX) {
    return false;
  }
  cur.count += 1;
  return true;
}
