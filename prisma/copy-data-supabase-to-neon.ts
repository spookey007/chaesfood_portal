/**
 * One-off: copy all application tables from the old Supabase DB → Neon (or any Postgres target).
 *
 * Requires:
 *   - DATABASE_URL_SUPABASE — source (old data)
 *   - DATABASE_URL — target (Neon); must differ from source after normalization
 *   - CONFIRM_DATA_COPY=yes — required to truncate target tables and copy (omit for --dry-run only)
 *
 * Usage:
 *   npx tsx prisma/copy-data-supabase-to-neon.ts --dry-run
 *   CONFIRM_DATA_COPY=yes npx tsx prisma/copy-data-supabase-to-neon.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  getPgPoolOptions,
  normalizePostgresUrl,
  redactedPostgresUrlForLog,
} from "../src/lib/database-connection";

const BATCH = 500;

function createClient(url: string): { prisma: PrismaClient; pool: Pool; normalized: string } {
  const normalized = normalizePostgresUrl(url);
  const pool = new Pool(getPgPoolOptions(normalized));
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool, normalized };
}

async function disconnect(pair: { prisma: PrismaClient; pool: Pool }): Promise<void> {
  await pair.prisma.$disconnect();
  await pair.pool.end();
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const sourceRaw = process.env.DATABASE_URL_SUPABASE?.trim();
  const targetRaw = process.env.DATABASE_URL?.trim();

  if (!sourceRaw) {
    throw new Error("Set DATABASE_URL_SUPABASE in .env to your old Supabase Postgres URL.");
  }
  if (!targetRaw) {
    throw new Error("Set DATABASE_URL in .env to your Neon Postgres URL (target).");
  }

  const sourceNorm = normalizePostgresUrl(sourceRaw);
  const targetNorm = normalizePostgresUrl(targetRaw);
  if (sourceNorm === targetNorm) {
    throw new Error("Source and target URLs are the same after normalization — aborting.");
  }

  if (!dryRun && process.env.CONFIRM_DATA_COPY !== "yes") {
    console.error(
      "This script will DELETE all rows in Category, User, Product, ProductVariation, Order, OrderItem on the target.\n" +
        "Run with --dry-run to inspect counts only, or set CONFIRM_DATA_COPY=yes to proceed.\n" +
        "Example: CONFIRM_DATA_COPY=yes npx tsx prisma/copy-data-supabase-to-neon.ts",
    );
    process.exit(1);
  }

  const src = createClient(sourceRaw);
  const dst = createClient(targetRaw);

  console.info("[copy-data] Source:", redactedPostgresUrlForLog(src.normalized));
  console.info("[copy-data] Target:", redactedPostgresUrlForLog(dst.normalized));

  const [
    categories,
    users,
    products,
    variations,
    orders,
    items,
  ] = await Promise.all([
    src.prisma.category.count(),
    src.prisma.user.count(),
    src.prisma.product.count(),
    src.prisma.productVariation.count(),
    src.prisma.order.count(),
    src.prisma.orderItem.count(),
  ]);

  console.info("[copy-data] Source row counts:", {
    Category: categories,
    User: users,
    Product: products,
    ProductVariation: variations,
    Order: orders,
    OrderItem: items,
  });

  if (dryRun) {
    console.info("[copy-data] Dry run — no changes made.");
    await disconnect(src);
    await disconnect(dst);
    return;
  }

  console.info("[copy-data] Truncating target tables (FK-safe order)…");
  await dst.prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.productVariation.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();
    await tx.user.deleteMany();
  });

  const catRows = await src.prisma.category.findMany();
  const userRows = await src.prisma.user.findMany();
  const productRows = await src.prisma.product.findMany();
  const variationRows = await src.prisma.productVariation.findMany();
  const orderRows = await src.prisma.order.findMany();
  const itemRows = await src.prisma.orderItem.findMany();

  console.info("[copy-data] Inserting into target…");

  if (catRows.length) {
    await dst.prisma.category.createMany({ data: catRows });
  }
  for (let i = 0; i < userRows.length; i += BATCH) {
    const chunk = userRows.slice(i, i + BATCH);
    await dst.prisma.user.createMany({ data: chunk });
  }
  for (let i = 0; i < productRows.length; i += BATCH) {
    const chunk = productRows.slice(i, i + BATCH);
    await dst.prisma.product.createMany({ data: chunk });
  }
  for (let i = 0; i < variationRows.length; i += BATCH) {
    const chunk = variationRows.slice(i, i + BATCH);
    await dst.prisma.productVariation.createMany({ data: chunk });
  }
  for (let i = 0; i < orderRows.length; i += BATCH) {
    const chunk = orderRows.slice(i, i + BATCH);
    await dst.prisma.order.createMany({ data: chunk });
  }
  for (let i = 0; i < itemRows.length; i += BATCH) {
    const chunk = itemRows.slice(i, i + BATCH);
    await dst.prisma.orderItem.createMany({ data: chunk });
  }

  console.info("[copy-data] Done. Verifying target counts…");
  const [c2, u2, p2, v2, o2, i2] = await Promise.all([
    dst.prisma.category.count(),
    dst.prisma.user.count(),
    dst.prisma.product.count(),
    dst.prisma.productVariation.count(),
    dst.prisma.order.count(),
    dst.prisma.orderItem.count(),
  ]);
  console.info("[copy-data] Target row counts:", {
    Category: c2,
    User: u2,
    Product: p2,
    ProductVariation: v2,
    Order: o2,
    OrderItem: i2,
  });

  await disconnect(src);
  await disconnect(dst);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
