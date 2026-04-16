"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useStorefrontCart } from "@/contexts/storefront-cart-context";
import type { CartPayload } from "@/lib/cart-types";

function money(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export function CartPageClient() {
  const { lines, hydrated, itemCount, totalCents, setLineQuantity, removeLine, replaceLines } = useStorefrontCart();

  const [bagOpen, setBagOpen] = useState(true);
  const serverDraftFetched = useRef(false);

  useEffect(() => {
    if (!hydrated || lines.length > 0 || serverDraftFetched.current) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = (await res.json()) as { order: CartPayload | null };
        if (cancelled) return;
        if (data.order?.items?.length) {
          replaceLines(
            data.order.items.map((i) => ({
              productSku: i.productSku,
              productName: i.productName,
              quantity: i.quantity,
              unitPriceCents: i.unitPriceCents,
            })),
          );
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) serverDraftFetched.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, lines.length, replaceLines]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} aria-hidden />
        <span className="text-sm">Loading cart…</span>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-24">
        <ShoppingBag className="mx-auto h-14 w-14 text-black/15" strokeWidth={1.25} aria-hidden />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">Add products from the catalog — updates are instant (saved in this browser).</p>
        <Link
          href="/products"
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-95"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 sm:pb-12">
      <div className="flex flex-col gap-2 border-b border-black/5 pb-6 sm:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Cart</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Your bag
        </h1>
        <p className="text-sm text-muted">
          {itemCount} {itemCount === 1 ? "item" : "items"} · {money(totalCents)} · Continue to checkout when you&apos;re
          ready.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setBagOpen((v) => !v)}
            className="flex min-h-[52px] w-full touch-manipulation items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-black/[0.02] sm:min-h-0 sm:px-5 sm:py-4"
            aria-expanded={bagOpen}
          >
            <div>
              <p className="text-sm font-bold text-foreground">Items</p>
              <p className="text-xs text-muted">
                {itemCount} {itemCount === 1 ? "line" : "lines"} · {money(totalCents)}
              </p>
            </div>
            {bagOpen ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden />
            )}
          </button>
          <AnimatePresence initial={false}>
            {bagOpen ? (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="divide-y divide-black/5 border-t border-black/5"
              >
                {lines.map((line) => (
                  <li
                    key={line.productSku}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{line.productName}</p>
                      <p className="mt-0.5 text-xs text-muted">{money(line.unitPriceCents)} each</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="sr-only" htmlFor={`cart-qty-${line.productSku}`}>
                        Quantity
                      </label>
                      <select
                        id={`cart-qty-${line.productSku}`}
                        value={line.quantity}
                        onChange={(e) => setLineQuantity(line.productSku, Number(e.target.value))}
                        className="min-h-[44px] rounded-lg border border-black/10 bg-white px-3 py-2 text-base sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm font-semibold text-foreground">
                        {money(line.unitPriceCents * line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(line.productSku)}
                        className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg p-2 text-muted transition hover:bg-chart-alert/10 hover:text-chart-alert"
                        aria-label={`Remove ${line.productName}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </section>

        <aside className="h-fit space-y-4 lg:sticky lg:top-[calc(5.5rem+env(safe-area-inset-top,0px))]">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 text-sm">
              <span className="text-muted">Total</span>
              <span className="text-xl font-bold text-primary">{money(totalCents)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-6 flex min-h-[52px] w-full touch-manipulation items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95"
            >
              Continue to checkout
            </Link>
            <Link href="/products" className="mt-3 block text-center text-sm font-semibold text-primary hover:underline">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
