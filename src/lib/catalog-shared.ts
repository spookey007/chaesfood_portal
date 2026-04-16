import { z } from "zod";

/** Composite cart / order line SKU: `productId::variationId`. */
export const CART_SKU_VARIATION_SEP = "::";

export const variationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const productSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  name: z.string(),
  section: z.enum(["Fresh", "Dry", "Frozen"]),
  category: z.string(),
  price: z.number().positive(),
  image: z.string(),
  description: z.string().optional(),
  imageAlt: z.string().optional(),
  variations: z.array(variationEntrySchema).optional(),
  requiresVariation: z.boolean().optional(),
});

export const fileSchema = z.object({
  currency: z.string().default("USD"),
  products: z.array(productSchema),
});

export type CatalogProduct = z.infer<typeof productSchema>;
export type CatalogFile = z.infer<typeof fileSchema>;

const categoryItemSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  name: z.string(),
  image: z.string(),
  imageAlt: z.string().optional(),
  price: z.number().positive(),
  variations: z.array(variationEntrySchema).default([]),
  requiresVariation: z.boolean().optional(),
});

const categorySchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  title: z.string(),
  items: z.array(categoryItemSchema),
});

export const categoriesCatalogSchema = z.object({
  version: z.number().optional(),
  currency: z.string().default("USD"),
  categories: z.array(categorySchema),
});

export type CategoriesCatalog = z.infer<typeof categoriesCatalogSchema>;

function sectionFromCategoryTitle(title: string): CatalogProduct["section"] {
  const t = title.trim().toLowerCase();
  if (t === "fresh") return "Fresh";
  if (t === "frozen") return "Frozen";
  return "Dry";
}

/** Normalize on-disk categories JSON into the flat catalog shape used by cart and UI. */
export function categoriesCatalogToFlat(data: CategoriesCatalog): CatalogFile {
  return {
    currency: data.currency,
    products: data.categories.flatMap((c) =>
      c.items.map((item): CatalogProduct => {
        const variations = item.variations.length ? item.variations : undefined;
        const requiresVariation =
          item.requiresVariation ?? (item.variations.length > 1);
        const image = item.image.replace(/^\//, "");
        return {
          id: item.id,
          slug: item.slug ?? item.id,
          name: item.name,
          section: sectionFromCategoryTitle(c.title),
          category: c.title,
          price: item.price,
          image,
          description: undefined,
          imageAlt: item.imageAlt,
          variations,
          requiresVariation,
        };
      }),
    ),
  };
}

/** Accept legacy flat `products[]` or nested `categories[]` from products.json. */
export function parseCatalogDiskJson(raw: unknown): CatalogFile {
  if (raw && typeof raw === "object" && "categories" in raw && Array.isArray((raw as { categories: unknown }).categories)) {
    return categoriesCatalogToFlat(categoriesCatalogSchema.parse(raw));
  }
  return fileSchema.parse(raw);
}

export function lineSku(productId: string, variationId?: string | null): string {
  if (!variationId) return productId;
  return `${productId}${CART_SKU_VARIATION_SEP}${variationId}`;
}

export function lineDisplayName(productName: string, variationName?: string | null): string {
  if (!variationName) return productName;
  return `${productName} — ${variationName}`;
}

/** Split composite cart SKU `productId::variationId` (see `lineSku`). */
export function parseCompositeLineSku(sku: string): { productId: string; variationId: string | null } {
  const sep = CART_SKU_VARIATION_SEP;
  const i = sku.indexOf(sep);
  if (i === -1) return { productId: sku, variationId: null };
  const variationId = sku.slice(i + sep.length);
  return { productId: sku.slice(0, i), variationId: variationId || null };
}

/** Resolve display name and composite SKU for a catalog product + optional variation (browser or server). */
export function resolveCatalogLine(
  p: CatalogProduct,
  variationId: string | null | undefined,
): { sku: string; lineName: string } {
  const vars = p.variations ?? [];
  if (vars.length === 0) {
    return { sku: lineSku(p.id, null), lineName: lineDisplayName(p.name, null) };
  }
  if (vars.length === 1) {
    const only = vars[0];
    if (variationId != null && variationId !== "" && variationId !== only.id) {
      throw new Error("Invalid variation");
    }
    return {
      sku: lineSku(p.id, only.id),
      lineName: lineDisplayName(p.name, only.name),
    };
  }
  if (variationId == null || variationId === "") {
    throw new Error("Choose a variation before adding to cart.");
  }
  const chosen = vars.find((v) => v.id === variationId);
  if (!chosen) throw new Error("Invalid variation");
  return {
    sku: lineSku(p.id, chosen.id),
    lineName: lineDisplayName(p.name, chosen.name),
  };
}

export function productImageSrc(image: string): string {
  if (image.startsWith("http")) return image;
  return `/${image.replace(/^\//, "")}`;
}

/** Stored paths in JSON are like `product_images/fresh/chicken.jpg` (no leading slash). */
export function splitRelativeImagePath(image: string): { folder: string; file: string } {
  const normalized = image.replace(/^\/+/, "");
  const last = normalized.lastIndexOf("/");
  if (last <= 0) return { folder: "", file: normalized };
  return { folder: normalized.slice(0, last), file: normalized.slice(last + 1) };
}

/** Build public URL from DB columns (folder + file only). */
export function productImagePublicPath(folder: string, file: string): string {
  const f = folder.replace(/^\/+/, "").replace(/\/+$/, "");
  const n = file.replace(/^\/+/, "");
  if (!f) return `/${n}`;
  return `/${f}/${n}`;
}

export function storageKey(section: CatalogProduct["section"]): "fresh" | "dry" | "frozen" {
  return section.toLowerCase() as "fresh" | "dry" | "frozen";
}

export function priceToCents(price: number): number {
  return Math.round(price * 100);
}
