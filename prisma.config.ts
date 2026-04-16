import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: datasource URL lives here (not in schema.prisma). Same as app + seed: `DATABASE_URL` only.
// Keep in sync with `getCliDatabaseUrl` / `getAppDatabaseUrl` in src/lib/database-connection.ts.
const databaseUrl = process.env.DATABASE_URL?.trim() || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
