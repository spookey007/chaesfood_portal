"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function ThanksBody({ reference, orderId }: { reference?: string; orderId?: string }) {
  const hasIds = Boolean(reference || orderId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Thank you</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Your order is in</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
        We received your request. You&apos;ll get a confirmation at the email you provided. Keep the details below
        handy if you contact us about this order.
      </p>

      {hasIds ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease }}
          className="mx-auto mt-10 max-w-lg space-y-4 text-left"
        >
          {orderId ? (
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Order ID</p>
              <p className="mt-2 break-all font-mono text-sm font-semibold text-foreground sm:text-base">{orderId}</p>
              <p className="mt-2 text-xs text-muted">Internal reference — quote this when you speak with our team.</p>
            </div>
          ) : null}
          {reference ? (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Order reference</p>
              <p className="mt-2 font-mono text-lg font-bold tracking-tight text-foreground">{reference}</p>
              <p className="mt-2 text-xs text-muted">Human-friendly code on invoices and delivery notes.</p>
            </div>
          ) : null}
        </motion.div>
      ) : (
        <p className="mx-auto mt-8 max-w-sm text-sm text-muted">
          If you expected an order summary here, return to checkout from your cart — this page is shown after a
          successful order.
        </p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-md transition hover:opacity-90"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
        >
          Home
        </Link>
      </motion.div>
    </motion.div>
  );
}
