"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PaymentType } from "@/generated/prisma/enums";
import { useStorefrontCart } from "@/contexts/storefront-cart-context";
import type { CartPayload } from "@/lib/cart-types";

function money(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function clientValidateCheckout(guestName: string, guestEmail: string, deliveryAddress: string): string | null {
  const name = guestName.trim();
  if (name.length < 2) return "Please enter your name (at least 2 characters).";
  const email = guestEmail.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  if (deliveryAddress.trim().length < 8) return "Please enter a full delivery address.";
  return null;
}

export function CheckoutPageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { lines, hydrated, itemCount, totalCents, replaceLines } = useStorefrontCart();

  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH_ON_DELIVERY);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const seededSessionDefaults = useRef(false);
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

  useEffect(() => {
    if (seededSessionDefaults.current || !session?.user) return;
    setGuestName((prev) => prev || session.user.name?.trim() || "");
    setGuestEmail((prev) => prev || session.user.email || "");
    seededSessionDefaults.current = true;
  }, [session]);

  /** Empty checkout → cart. Skip while submitting so a successful order can navigate to /thanks before cart clears. */
  useEffect(() => {
    if (!hydrated || submitting) return;
    if (lines.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, lines.length, router, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const clientErr = clientValidateCheckout(guestName, guestEmail, deliveryAddress);
    if (clientErr) {
      setFormError(clientErr);
      return;
    }
    if (lines.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType,
          lines: lines.map((l) => ({
            productSku: l.productSku,
            productName: l.productName,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
          })),
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          deliveryAddress: deliveryAddress.trim(),
          note: note.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        orderId?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || typeof data.reference !== "string" || typeof data.orderId !== "string") {
        setFormError(typeof data.error === "string" ? data.error : "Could not place order.");
        return;
      }
      // Do not clear() here — it empties `lines` while still on this page, which triggers
      // router.replace("/cart") and races with /thanks. `ThanksClearCart` clears after navigation.
      const q = new URLSearchParams();
      q.set("ref", data.reference);
      q.set("id", data.orderId);
      router.push(`/thanks?${q.toString()}`);
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} aria-hidden />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-6xl px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 sm:pb-12">
      <AnimatePresence>
        {submitting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[1px]"
            aria-live="polite"
            aria-busy
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white px-10 py-8 shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.75} aria-hidden />
              <p className="text-sm font-semibold text-foreground">Placing your order…</p>
              <p className="max-w-xs text-center text-xs text-muted">Validating your cart and saving the order.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-col gap-2 border-b border-black/5 pb-6 sm:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Payment &amp; delivery
        </h1>
        <p className="text-sm text-muted">
          {itemCount} {itemCount === 1 ? "item" : "items"} · {money(totalCents)} · Choose how you&apos;ll pay, then confirm.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]"
      >
        <div className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Payment</h2>
            <p className="mt-1 text-xs text-muted">Card payments will use this same step when enabled.</p>
            <fieldset className="mt-5 space-y-3">
              <legend className="sr-only">Payment type</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-white p-4 transition hover:border-primary/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/[0.04]">
                <input
                  type="radio"
                  name="paymentType"
                  className="mt-1"
                  checked={paymentType === PaymentType.CASH_ON_DELIVERY}
                  onChange={() => setPaymentType(PaymentType.CASH_ON_DELIVERY)}
                  disabled={submitting}
                />
                <span>
                  <span className="block text-sm font-bold text-foreground">Cash on delivery</span>
                  <span className="mt-0.5 block text-xs text-muted">Pay when your order arrives.</span>
                </span>
              </label>
              <label className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-4 opacity-70">
                <input type="radio" name="paymentType" className="mt-1" disabled aria-disabled="true" />
                <span>
                  <span className="block text-sm font-bold text-foreground">Pay online</span>
                  <span className="mt-0.5 block text-xs text-muted">Card checkout coming soon.</span>
                </span>
              </label>
            </fieldset>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Delivery &amp; contact</h2>
            <p className="mt-1 text-xs text-muted">We&apos;ll confirm by email.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="checkout-name" className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Full name
                </label>
                <input
                  id="checkout-name"
                  name="guestName"
                  type="text"
                  autoComplete="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-base outline-none ring-primary/30 transition focus:ring-2 disabled:opacity-50 sm:min-h-0 sm:py-2.5 sm:text-sm"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label htmlFor="checkout-email" className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Email
                </label>
                <input
                  id="checkout-email"
                  name="guestEmail"
                  type="email"
                  autoComplete="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-base outline-none ring-primary/30 transition focus:ring-2 disabled:opacity-50 sm:min-h-0 sm:py-2.5 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-address" className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Delivery address
                </label>
                <textarea
                  id="checkout-address"
                  name="deliveryAddress"
                  rows={4}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-3 text-base outline-none ring-primary/30 transition focus:ring-2 disabled:opacity-50 sm:text-sm"
                  required
                  minLength={8}
                  placeholder="Street, city, state, ZIP"
                />
              </div>
              <div>
                <label htmlFor="checkout-note" className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Order notes <span className="font-normal normal-case text-muted">(optional)</span>
                </label>
                <textarea
                  id="checkout-note"
                  name="note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-3 text-base outline-none ring-primary/30 transition focus:ring-2 disabled:opacity-50 sm:text-sm"
                  maxLength={2000}
                />
              </div>
            </div>
            {formError ? (
              <p className="mt-4 text-sm font-medium text-chart-alert" role="alert">
                {formError}
              </p>
            ) : null}
          </section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-[calc(5.5rem+env(safe-area-inset-top,0px))]">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 text-sm">
              <span className="text-muted">Total</span>
              <span className="text-xl font-bold text-primary">{money(totalCents)}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Prices are verified on the server from our catalog when you place the order.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex min-h-[52px] w-full touch-manipulation items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Placing order…" : "Place order"}
            </button>
            <Link href="/cart" className="mt-3 block text-center text-sm font-semibold text-primary hover:underline">
              Back to cart
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
