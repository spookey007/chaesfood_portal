import { Suspense } from "react";
import { readCatalog } from "@/lib/catalog";
import { ProductsCatalog } from "./products-catalog";

export default async function ProductsPage() {
  const data = await readCatalog();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
          Loading catalog…
        </div>
      }
    >
      <ProductsCatalog products={data.products} currency={data.currency} />
    </Suspense>
  );
}
