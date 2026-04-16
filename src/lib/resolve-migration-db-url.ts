/**
 * Re-export for older imports. Same as `getAppDatabaseUrl`: `DATABASE_URL` only.
 * Kept so existing imports keep working.
 */
export { getCliDatabaseUrl as resolveMigrationDatabaseUrl } from "@/lib/database-connection";
