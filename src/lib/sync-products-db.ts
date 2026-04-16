import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
import { fileSchema, splitRelativeImagePath, storageKey, type CatalogFile } from "./catalog-shared";

const CATEGORY_SEED: { id: string; title: string; sortOrder: number }[] = [
  { id: "fresh", title: "Fresh", sortOrder: 0 },
  { id: "dry", title: "Dry", sortOrder: 1 },
  { id: "frozen", title: "Frozen", sortOrder: 2 },
];

/** Interactive transaction budget — many products + variations over a remote DB can exceed 5s default. */
const SYNC_TX_TIMEOUT_MS = 120_000;

/** Replace catalog tables from `products.json` (normalized). */
export async function syncProductsToDatabase(client: PrismaClient, data: CatalogFile): Promise<void> {
  const parsed = fileSchema.parse(data);

  await client.$transaction(
    async (tx) => {
      await tx.productVariation.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();

      for (const c of CATEGORY_SEED) {
        await tx.category.create({ data: c });
      }

      for (const p of parsed.products) {
        const categoryId = storageKey(p.section);
        const { folder, file } = splitRelativeImagePath(p.image);
        await tx.product.create({
          data: {
            id: p.id,
            categoryId,
            slug: p.slug ?? p.id,
            name: p.name,
            priceCents: Math.round(p.price * 100),
            imageFolder: folder,
            imageFile: file,
            imageAlt: p.imageAlt ?? null,
            description: p.description ?? null,
            requiresVariation: p.requiresVariation ?? false,
          },
        });
      }

      const variationRows = parsed.products.flatMap((p) =>
        (p.variations ?? []).map((v) => ({
          id: randomUUID(),
          productId: p.id,
          externalId: v.id,
          name: v.name,
        })),
      );
      if (variationRows.length > 0) {
        await tx.productVariation.createMany({ data: variationRows });
      }
    },
    { timeout: SYNC_TX_TIMEOUT_MS, maxWait: 20_000 },
  );
}
