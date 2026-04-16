"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { moneyUsd } from "@/components/admin/format";
import { productImagePublicPath } from "@/lib/catalog-shared";

type DetailUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
} | null;

type DetailItem = {
  id: string;
  lineSku: string;
  productName: string;
  productId: string | null;
  variationExternalId: string | null;
  variationName: string | null;
  imageFolder: string | null;
  imageFile: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type DetailOrder = {
  id: string;
  reference: string;
  status: string;
  paymentType: string | null;
  paymentStatus: string;
  totalCents: number;
  currency: string;
  note: string | null;
  deliveryAddress: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: DetailUser;
  createdAt: string;
  updatedAt: string;
  items: DetailItem[];
};

const spring = { type: "spring" as const, stiffness: 420, damping: 34 };

function statusBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "border-slate-300/90 bg-slate-100 text-slate-900";
    case "PENDING_PAYMENT":
      return "border-amber-400/70 bg-amber-50 text-amber-950";
    case "PAID":
      return "border-emerald-400/70 bg-emerald-50 text-emerald-950";
    case "FULFILLED":
      return "border-sky-400/70 bg-sky-50 text-sky-950";
    case "CANCELLED":
      return "border-red-400/70 bg-red-50 text-red-950";
    default:
      return "border-black/10 bg-surface-muted text-foreground";
  }
}

function LineImage({ item }: { item: DetailItem }) {
  const [broken, setBroken] = useState(false);
  if (!item.imageFolder || !item.imageFile || broken) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-black/15 bg-surface-muted text-[10px] font-medium text-muted sm:h-16 sm:w-16">
        No image
      </div>
    );
  }
  const src = productImagePublicPath(item.imageFolder, item.imageFile);
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white sm:h-16 sm:w-16">
      <Image
        src={src}
        alt={item.productName}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 18vw, 64px"
        unoptimized
        onError={() => setBroken(true)}
      />
    </div>
  );
}

export function OrderDetailModal({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<DetailOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setErr(null);
    setOrder(null);
    const r = await fetch(`/api/admin/orders/${id}`);
    if (!r.ok) {
      setErr(r.status === 401 ? "Unauthorized." : "Could not load order.");
      setLoading(false);
      return;
    }
    const j = (await r.json()) as { order: DetailOrder };
    setOrder(j.order);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setErr(null);
      setLoading(false);
      return;
    }
    void load(orderId);
  }, [orderId, load]);

  return (
    <AnimatePresence>
      {orderId ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={spring}
            className="relative z-10 flex max-h-[min(94dvh,840px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:mx-2 sm:max-h-[min(90dvh,820px)] sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Order detail</p>
                <h2 id="order-detail-title" className="font-heading text-lg font-extrabold text-foreground">
                  {loading ? "Loading…" : order?.reference ?? "—"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
                  <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.75} />
                  <p className="text-sm font-medium">Loading order…</p>
                </div>
              ) : err ? (
                <p className="rounded-xl border border-chart-alert/30 bg-chart-alert/10 px-4 py-3 text-sm">{err}</p>
              ) : order ? (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-black/5 bg-surface-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted">Order ID</p>
                      <p className="mt-1 break-all font-mono text-xs text-foreground">{order.id}</p>
                    </div>
                    <div className="rounded-xl border border-black/5 bg-surface-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted">Status</p>
                      <span
                        className={`mt-2 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(order.status)}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="rounded-xl border border-black/5 bg-surface-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted">Placed</p>
                      <p className="mt-1 text-sm text-foreground">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-black/5 bg-surface-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted">Total</p>
                      <p className="mt-1 text-lg font-bold text-primary">{moneyUsd(order.totalCents)}</p>
                      <p className="mt-0.5 text-xs text-muted">{order.currency}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-black/5 p-4">
                    <p className="text-[10px] font-bold uppercase text-muted">Payment</p>
                    <p className="mt-2 text-sm text-foreground">
                      {order.paymentType
                        ? order.paymentType.replace(/_/g, " ").toLowerCase()
                        : "Not set"}{" "}
                      · {order.paymentStatus.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/5 p-4">
                    <p className="text-[10px] font-bold uppercase text-muted">Customer</p>
                    {order.user ? (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold text-foreground">{order.user.name ?? order.user.email}</p>
                        <p className="text-muted">{order.user.email}</p>
                        {order.user.phone ? <p className="mt-1 text-muted">Phone: {order.user.phone}</p> : null}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold text-foreground">{order.guestName ?? "Guest"}</p>
                        <p className="text-muted">{order.guestEmail ?? "—"}</p>
                        {order.guestPhone ? <p className="mt-1 text-muted">Phone: {order.guestPhone}</p> : null}
                      </div>
                    )}
                  </div>

                  {order.deliveryAddress ? (
                    <div className="rounded-xl border border-black/5 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted">Delivery address</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  ) : null}

                  {order.note ? (
                    <div className="rounded-xl border border-black/5 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted">Customer note</p>
                      <p className="mt-2 text-sm text-foreground">{order.note}</p>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Line items</p>
                    <ul
                      className={`mt-3 space-y-4 ${
                        order.items.length > 3
                          ? "max-h-[min(52dvh,400px)] overflow-y-auto overscroll-contain pr-1 sm:max-h-[min(48dvh,440px)]"
                          : ""
                      }`}
                    >
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-col gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:flex-row sm:gap-4"
                        >
                          <LineImage item={item} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{item.productName}</p>
                            <p className="mt-1 font-mono text-xs text-muted">SKU: {item.lineSku}</p>
                            {item.variationExternalId || item.variationName ? (
                              <p className="mt-2 text-xs text-foreground">
                                <span className="font-semibold text-muted">Variation: </span>
                                {item.variationName ?? "—"}
                                {item.variationExternalId ? (
                                  <span className="text-muted"> ({item.variationExternalId})</span>
                                ) : null}
                              </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                              <span className="text-muted">
                                {item.quantity} × {moneyUsd(item.unitPriceCents)}
                              </span>
                              <span className="font-bold tabular-nums text-foreground">
                                {moneyUsd(item.lineTotalCents)}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-black/5 bg-surface-muted/30 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-black/10 bg-white py-3 text-sm font-semibold text-foreground shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
