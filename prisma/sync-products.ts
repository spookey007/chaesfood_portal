import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { fileSchema } from "../src/lib/catalog-shared";
import {
  getCliDatabaseUrl,
  getPgPoolOptions,
  logDevCliDatabaseContext,
  normalizePostgresUrl,
} from "../src/lib/database-connection";
import { syncProductsToDatabase } from "../src/lib/sync-products-db";

function createPrisma() {
  const raw = getCliDatabaseUrl();
  logDevCliDatabaseContext(normalizePostgresUrl(raw));
  const pool = new Pool(getPgPoolOptions(raw));
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

async function main() {
  const { prisma, pool } = createPrisma();
  try {
    const catalogPath = path.join(process.cwd(), "src", "data", "products.json");
    const raw = await readFile(catalogPath, "utf8");
    const catalog = fileSchema.parse(JSON.parse(raw));
    await syncProductsToDatabase(prisma, catalog);
    console.log(`Synced ${catalog.products.length} products (categories + variations + image folder/file).`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
