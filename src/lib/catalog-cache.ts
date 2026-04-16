import type { CatalogFile } from "@/lib/catalog-shared";

let cached: CatalogFile | null = null;
let cachedAt = 0;

const DEFAULT_TTL_MS = 45_000;

/** In-memory catalog (short TTL) to avoid hammering Postgres on every cart line / checkout validation. */
export function getCachedCatalog(): CatalogFile | null {
  if (!cached) return null;
  if (Date.now() - cachedAt > DEFAULT_TTL_MS) {
    cached = null;
    return null;
  }
  return cached;
}

export function setCachedCatalog(data: CatalogFile): void {
  cached = data;
  cachedAt = Date.now();
}

export function invalidateCatalogCache(): void {
  cached = null;
  cachedAt = 0;
}
