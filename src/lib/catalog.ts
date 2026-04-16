import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { invalidateCatalogCache, getCachedCatalog, setCachedCatalog } from "@/lib/catalog-cache";
import {
  fileSchema,
  parseCatalogDiskJson,
  type CatalogFile,
  type CatalogProduct,
} from "@/lib/catalog-shared";
import { syncProductsToDatabase } from "@/lib/sync-products-db";

export { fileSchema, type CatalogFile, type CatalogProduct } from "@/lib/catalog-shared";
export { parseCatalogDiskJson, categoriesCatalogSchema } from "@/lib/catalog-shared";
export { productImageSrc, storageKey, priceToCents, productImagePublicPath, splitRelativeImagePath } from "@/lib/catalog-shared";
export { syncProductsToDatabase } from "@/lib/sync-products-db";

const jsonPath = () => path.join(process.cwd(), "src", "data", "products.json");

async function loadCatalogFromSources(): Promise<CatalogFile> {
  const rawText = await readFile(jsonPath(), "utf8");
  const raw = JSON.parse(rawText) as unknown;
  const fromDisk = parseCatalogDiskJson(raw);

  try {
    const rows = await prisma.product.findMany({
      include: {
        category: true,
        variations: { orderBy: { name: "asc" } },
      },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
    });

    if (rows.length === 0) {
      return fromDisk;
    }

    const byId = new Map(fromDisk.products.map((p) => [p.id, p]));

    return {
      currency: fromDisk.currency,
      products: rows.map((r): CatalogProduct => {
        const disk = byId.get(r.id);
        return {
          id: r.id,
          slug: r.slug ?? r.id,
          name: r.name,
          section: r.category.title as CatalogProduct["section"],
          category: r.category.title,
          price: r.priceCents / 100,
          image: `${r.imageFolder}/${r.imageFile}`.replace(/^\/+/, ""),
          description: r.description ?? undefined,
          imageAlt: r.imageAlt ?? disk?.imageAlt,
          variations:
            r.variations.length > 0
              ? r.variations.map((v) => ({ id: v.externalId, name: v.name }))
              : disk?.variations,
          requiresVariation: r.requiresVariation,
        };
      }),
    };
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[readCatalog] Database unavailable — serving catalog from products.json only.\n", msg);
    }
    return fromDisk;
  }
}

export async function readCatalog(): Promise<CatalogFile> {
  const hit = getCachedCatalog();
  if (hit) return hit;
  const data = await loadCatalogFromSources();
  setCachedCatalog(data);
  return data;
}

/** Drop cached catalog after admin edits or tests. */
export function invalidateReadCatalogCache(): void {
  invalidateCatalogCache();
}

/** Persist flat catalog (legacy admin / tools). Prefer nested JSON via admin save action. */
export async function writeCatalog(data: CatalogFile): Promise<void> {
  const parsed = fileSchema.parse(data);
  await writeFile(jsonPath(), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  await syncProductsToDatabase(prisma, parsed);
  invalidateCatalogCache();
}
