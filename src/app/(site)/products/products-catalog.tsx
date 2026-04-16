"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, ShoppingBag } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-shared";
import { priceToCents, resolveCatalogLine, storageKey } from "@/lib/catalog-shared";
import { useStorefrontCart } from "@/contexts/storefront-cart-context";
import { ProductTileImage } from "./product-tile-image";

type Storage = "all" | "fresh" | "dry" | "frozen";
type Sort = "price-asc" | "price-desc" | "name";

const ease = [0.22, 1, 0.36, 1] as const;

function money(price: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(price);
}

function variationSummary(p: CatalogProduct): string | null {
  const v = p.variations;
  if (!v?.length) return null;
  return v.map((x) => x.name).join(" · ");
}

export function ProductsCatalog({ products, currency }: { products: CatalogProduct[]; currency: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addLine } = useStorefrontCart();
  const [toast, setToast] = useState<{ message: string; productName?: string } | null>(null);
  const [modalProduct, setModalProduct] = useState<CatalogProduct | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);

  const initialStorage = (searchParams.get("storage") as Storage) || "all";
  const initialSort = (searchParams.get("sort") as Sort) || "price-asc";
  const [storage, setStorage] = useState<Storage>(initialStorage);
  const [sort, setSort] = useState<Sort>(initialSort);

  const filtered = useMemo(() => {
    let list = [...products];
    if (storage !== "all") {
      list = list.filter((p) => storageKey(p.section) === storage);
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const ac = priceToCents(a.price);
      const bc = priceToCents(b.price);
      return sort === "price-asc" ? ac - bc : bc - ac;
    });
    return list;
  }, [products, storage, sort]);

  function syncUrl(nextStorage: Storage, nextSort: Sort) {
    const p = new URLSearchParams(searchParams.toString());
    if (nextStorage === "all") p.delete("storage");
    else p.set("storage", nextStorage);
    if (nextSort === "price-asc") p.delete("sort");
    else p.set("sort", nextSort);
    router.replace(`/products?${p.toString()}`, { scroll: false });
  }

  function onStorage(v: Storage) {
    setStorage(v);
    syncUrl(v, sort);
  }

  function onSort(v: Sort) {
    setSort(v);
    syncUrl(storage, v);
  }

  const closeModal = useCallback(() => {
    setModalProduct(null);
    setSelectedVariationId(null);
  }, []);

  useEffect(() => {
    if (!modalProduct) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalProduct, closeModal]);

  useEffect(() => {
    if (modalProduct) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [modalProduct]);

  function addProductToCart(p: CatalogProduct, variationId: string | null, displayName: string) {
    try {
      const { sku, lineName } = resolveCatalogLine(p, variationId);
      const unit = priceToCents(p.price);
      addLine(sku, lineName, unit, 1);
      setToast({ message: "Added to cart", productName: displayName });
      setTimeout(() => setToast(null), 3400);
      closeModal();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add to cart";
      setToast({ message: msg });
      setTimeout(() => setToast(null), 2600);
    }
  }

  function openVariationModal(p: CatalogProduct) {
    const vars = p.variations ?? [];
    if (vars.length === 0) {
      addProductToCart(p, null, p.name);
      return;
    }
    setModalProduct(p);
    setSelectedVariationId(vars.length === 1 ? vars[0].id : null);
  }

  function confirmModalAdd() {
    if (!modalProduct) return;
    const vars = modalProduct.variations ?? [];
    if (vars.length > 1 && !selectedVariationId) return;

    const vName = vars.find((v) => v.id === selectedVariationId)?.name ?? modalProduct.name;
    addProductToCart(modalProduct, selectedVariationId, `${modalProduct.name} — ${vName}`);
  }

  const chips: { id: Storage; label: string }[] = [
    { id: "all", label: "All" },
    { id: "fresh", label: "Fresh" },
    { id: "dry", label: "Dry" },
    { id: "frozen", label: "Frozen" },
  ];

  const modalVars = modalProduct?.variations ?? [];
  const canConfirmModal =
    !!modalProduct &&
    modalVars.length > 0 &&
    (modalVars.length === 1 || (selectedVariationId != null && selectedVariationId !== ""));

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10 lg:py-12">
      <div className="flex flex-col gap-2 border-b border-dashed border-black/10 pb-6 sm:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Catalog</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Products
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Filter by category and sort by price. Add to cart is instant (saved in your browser); we verify prices when you
          place an order from the cart. Currency: {currency}.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:mt-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onStorage(c.id)}
              className={`shrink-0 snap-start rounded-full border px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] sm:py-2 ${
                storage === c.id
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-black/10 bg-white text-muted hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <label
            htmlFor="catalog-sort"
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Sort
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => onSort(e.target.value as Sort)}
            className="min-h-[44px] w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base font-medium text-foreground outline-none ring-ring/25 focus:ring-4 sm:min-h-0 sm:w-56 sm:text-sm"
          >
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:gap-6 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => {
            const summary = variationSummary(p);
            const hasVariations = (p.variations?.length ?? 0) > 0;
            return (
              <motion.article
                layout
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm ring-1 ring-black/[0.02] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-primary/15 focus-within:ring-2 focus-within:ring-primary/30"
              >
                {/* In-flow padding establishes height for `fill` images (absolute children do not size the box). */}
                <div className="relative w-full shrink-0 overflow-hidden bg-gradient-to-b from-surface-muted to-surface-muted/80">
                  <div className="block w-full pb-[100%] sm:pb-[75%]" aria-hidden />
                  <div className="absolute inset-0">
                    <ProductTileImage product={p} />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="absolute left-2.5 top-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[11px]">
                      {p.section}
                    </span>
                    {hasVariations ? (
                      <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm sm:bottom-3 sm:left-3 sm:text-xs">
                        Options
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col p-3.5 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs">{p.category}</p>
                  <h2 className="mt-1 text-base font-bold leading-snug text-foreground sm:text-lg">
                    <span className="line-clamp-2">{p.name}</span>
                    {summary ? (
                      <span className="mt-1.5 block text-[11px] font-normal normal-case leading-snug text-muted sm:text-xs">
                        <span className="line-clamp-2">{summary}</span>
                      </span>
                    ) : null}
                  </h2>
                  {p.description ? (
                    <p className="mt-2 line-clamp-2 min-h-0 text-xs leading-relaxed text-muted sm:line-clamp-3">
                      {p.description}
                    </p>
                  ) : (
                    <div className="mt-2 min-h-0 flex-1 sm:min-h-[2.75rem]" />
                  )}
                  <div className="mt-auto flex flex-col gap-3 border-t border-black/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
                    <p className="text-lg font-bold tabular-nums text-primary sm:text-xl">{money(p.price)}</p>
                    <button
                      type="button"
                      onClick={() => openVariationModal(p)}
                      className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-[color:var(--primary-hover)] active:scale-[0.98] sm:min-h-0 sm:w-auto sm:py-2.5"
                    >
                      <Plus className="h-4 w-4 shrink-0 sm:h-[1.05rem] sm:w-[1.05rem]" strokeWidth={2.25} aria-hidden />
                      Add to cart
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalProduct ? (
          <motion.div
            key="backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 pb-[env(safe-area-inset-bottom,0px)] sm:items-center sm:p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="variation-modal-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease }}
              className="w-full max-w-md rounded-t-[1.35rem] border border-black/10 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h2 id="variation-modal-title" className="text-lg font-semibold text-foreground">
                {modalProduct.name}
              </h2>
              <p className="mt-1 text-sm text-muted">Select a variation, then add to cart.</p>
              <div className="mt-5 max-h-[min(45dvh,22rem)] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[min(50vh,22rem)]">
                {modalVars.map((v) => {
                  const id = `var-${modalProduct.id}-${v.id}`;
                  return (
                    <label
                      key={v.id}
                      htmlFor={id}
                      className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-3.5 text-sm transition sm:min-h-0 sm:py-3 ${
                        selectedVariationId === v.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-black/10 hover:border-primary/30"
                      }`}
                    >
                      <input
                        id={id}
                        type="radio"
                        name="variation"
                        value={v.id}
                        checked={selectedVariationId === v.id}
                        onChange={() => setSelectedVariationId(v.id)}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                      <span className="font-medium text-foreground">{v.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[48px] rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-black/[0.03] sm:min-h-0 sm:py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canConfirmModal}
                  onClick={confirmModalAdd}
                  className="min-h-[48px] rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-[color:var(--primary-hover)] disabled:opacity-50 sm:min-h-0 sm:py-2.5"
                >
                  Add to cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 z-[80] flex items-center gap-2.5 rounded-xl border border-black/10 bg-neutral-900 px-3.5 py-3 text-white shadow-lg sm:left-1/2 sm:right-auto sm:min-w-[320px] sm:max-w-[440px] sm:-translate-x-1/2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-400" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
              {toast.productName ? (
                <p className="truncate text-xs text-white/70">{toast.productName}</p>
              ) : null}
            </div>
            <Link
              href="/cart"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium transition hover:bg-white/20 sm:text-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
              Cart
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
