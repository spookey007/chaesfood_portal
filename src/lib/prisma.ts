import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import {
  getAppDatabaseUrl,
  getPgPoolOptions,
  logDevDatabaseBootstrap,
  warnSupabasePoolerUsernameIfLikelyMisconfigured,
} from "@/lib/database-connection";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
  /** When this differs from `getAppDatabaseUrl()`, recycle pool + client (dev `.env` hot reload). */
  prismaConnectionUrl?: string;
};

function resolvePrismaClient(): PrismaClient {
  const url = getAppDatabaseUrl();
  if (globalForPrisma.prisma && globalForPrisma.prismaConnectionUrl === url) {
    return globalForPrisma.prisma;
  }

  const isUrlChange = Boolean(globalForPrisma.prismaConnectionUrl && globalForPrisma.prismaConnectionUrl !== url);

  void globalForPrisma.pool?.end().catch(() => {});
  void globalForPrisma.prisma?.$disconnect().catch(() => {});

  warnSupabasePoolerUsernameIfLikelyMisconfigured(url);

  const pool = new Pool(getPgPoolOptions(url));
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  globalForPrisma.pool = pool;
  globalForPrisma.prisma = client;
  globalForPrisma.prismaConnectionUrl = url;

  logDevDatabaseBootstrap(url, isUrlChange ? "reload" : "init");

  return client;
}

/**
 * Lazy singleton: recreates the pool when `DATABASE_URL` changes (e.g. Next dev “Reload env”),
 * so you are not stuck with a stale `pg` pool from an old `.env`.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolvePrismaClient();
    return Reflect.get(client, prop, client);
  },
}) as PrismaClient;
