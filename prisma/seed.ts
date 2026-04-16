import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";
import { parseCatalogDiskJson } from "../src/lib/catalog-shared";
import {
  getCliDatabaseUrl,
  getPgPoolOptions,
  logDevCliDatabaseContext,
  normalizePostgresUrl,
} from "../src/lib/database-connection";
import { syncProductsToDatabase } from "../src/lib/sync-products-db";

/** Primary site admin (sign in at /login). Override with ADMIN_EMAIL / ADMIN_PASSWORD in .env */
const adminEmail = (process.env.ADMIN_EMAIL?.trim() || "admin@chaesfood.local").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "AdminChaesFood2026!";

const customerEmail = (process.env.SEED_CUSTOMER_EMAIL ?? "customer@chaesfood.local").toLowerCase();
const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? "Customer123!";

function redactedHost(url: string): string {
  try {
    const u = new URL(url.replace(/^postgresql:/, "http:"));
    return `${u.hostname}:${u.port || "5432"}`;
  } catch {
    return "(could not parse URL)";
  }
}

function createPrisma() {
  const raw = getCliDatabaseUrl();
  logDevCliDatabaseContext(normalizePostgresUrl(raw));
  const pool = new Pool(getPgPoolOptions(raw));
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool, connectionString: raw };
}

async function main() {
  const { prisma, pool, connectionString } = createPrisma();
  console.log(`Seeding using DB host: ${redactedHost(connectionString)}`);
  try {
    const adminHash = await hash(adminPassword, 12);
    const customerHash = await hash(customerPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash: adminHash,
        name: "Site Admin",
        role: UserRole.ADMIN,
      },
      update: { passwordHash: adminHash, role: UserRole.ADMIN, name: "Site Admin" },
    });

    await prisma.user.upsert({
      where: { email: customerEmail },
      create: {
        email: customerEmail,
        passwordHash: customerHash,
        name: "Jamie Customer",
        role: UserRole.CUSTOMER,
      },
      update: { passwordHash: customerHash, name: "Jamie Customer", role: UserRole.CUSTOMER },
    });

    const catalogPath = path.join(process.cwd(), "src", "data", "products.json");
    const catalogRaw = await readFile(catalogPath, "utf8");
    const catalog = parseCatalogDiskJson(JSON.parse(catalogRaw));
    await syncProductsToDatabase(prisma, catalog);
    console.log(`Synced ${catalog.products.length} products (normalized schema: category, image folder/file, variations).`);

    console.log("\nSeed complete (admin + customer + catalog).");
    console.log("  ─── Admin (use at /login) ───");
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log("  (Override with ADMIN_EMAIL / ADMIN_PASSWORD in .env)");
    console.log("  ─── Sample customer ───");
    console.log(`  Email:    ${customerEmail}`);
    console.log(`  Password: ${customerPassword}`);
    console.log("  (Override with SEED_CUSTOMER_EMAIL / SEED_CUSTOMER_PASSWORD)");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
  if (code === "P1001" || (e as Error)?.message?.includes("reach database")) {
    console.error("\nCould not connect to Postgres (P1001). Try:\n");
    console.error("  1. Set DATABASE_URL in .env to your Neon (or host) connection string from the dashboard.");
    console.error("  2. Confirm the database is reachable (not paused) and TLS/query params match the provider.");
    console.error("  3. Ensure migrate has been applied: npx prisma migrate deploy\n");
  } else {
    console.error(e);
  }
  process.exit(1);
});
