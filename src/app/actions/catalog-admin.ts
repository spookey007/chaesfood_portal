"use server";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCatalogDiskJson } from "@/lib/catalog-shared";
import { syncProductsToDatabase } from "@/lib/sync-products-db";
import { invalidateReadCatalogCache } from "@/lib/catalog";

export type SaveCatalogState = { ok: true } | { ok: false; message: string } | undefined;

const catalogJsonPath = () => path.join(process.cwd(), "src", "data", "products.json");

export async function saveCatalogFormAction(
  _prev: SaveCatalogState,
  formData: FormData,
): Promise<SaveCatalogState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false, message: "Unauthorized" };
  }
  const jsonText = String(formData.get("json") ?? "");
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { ok: false, message: "Invalid JSON." };
    }
    const data = parseCatalogDiskJson(parsed);
    await writeFile(catalogJsonPath(), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    await syncProductsToDatabase(prisma, data);
    invalidateReadCatalogCache();
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save catalog.";
    return { ok: false, message: msg };
  }
}
