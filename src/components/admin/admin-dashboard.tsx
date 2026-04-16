"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutList, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { moneyUsd } from "@/components/admin/format";

const ease = [0.22, 1, 0.36, 1] as const;

export type AdminDashboardStats = {
  userCount: number;
  productCount: number;
  placedOrderCount: number;
  pendingPaymentCount: number;
  revenueCents: number;
};

export function AdminDashboard({ stats }: { stats: AdminDashboardStats }) {
  const cards = [
    {
      label: "Users",
      value: String(stats.userCount),
      hint: "Customers & staff",
      icon: Users,
      href: "/admin/users",
      tone: "from-primary/15 to-primary/5",
    },
    {
      label: "Products (DB)",
      value: String(stats.productCount),
      hint: "Manage in Products",
      icon: Package,
      href: "/admin/products",
      tone: "from-teal/20 to-teal/5",
    },
    {
      label: "Placed orders",
      value: String(stats.placedOrderCount),
      hint: `${stats.pendingPaymentCount} pending payment`,
      icon: ShoppingCart,
      href: "/admin/orders",
      tone: "from-warm/20 to-warm/5",
    },
    {
      label: "Paid revenue",
      value: moneyUsd(stats.revenueCents),
      hint: "Paid + fulfilled totals",
      icon: TrendingUp,
      href: "/admin/orders",
      tone: "from-chart-positive/25 to-chart-positive/5",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Live metrics from your Neon database. Use the sidebar to manage products, review orders, and audit user
          roles.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 + i * 0.05, ease }}
            >
              <Link
                href={card.href}
                className={`block h-full rounded-2xl border border-black/5 bg-gradient-to-br ${card.tone} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-xl bg-white/80 p-2 shadow-sm">
                    <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Open</span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                <p className="mt-1 text-xs text-muted">{card.hint}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading text-lg font-extrabold text-foreground">Operations</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground">Products</span> — edit catalog rows in Postgres; the
              storefront reads merged catalog from the database when available.
            </li>
            <li>
              <span className="font-semibold text-foreground">Orders</span> — update status as you fulfill or cancel
              lines.
            </li>
            <li>
              <span className="font-semibold text-foreground">Users</span> — inspect roles and order volume for
              support.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-black/5 bg-[#0c1328] p-6 text-white shadow-sm">
          <h2 className="font-heading text-lg font-extrabold">Shortcuts</h2>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-3 font-semibold hover:bg-white/15">
              Manage products →
            </Link>
            <Link href="/admin/orders" className="rounded-xl bg-white/10 px-4 py-3 font-semibold hover:bg-white/15">
              Review orders →
            </Link>
            <Link href="/products" className="rounded-xl border border-white/20 px-4 py-3 font-semibold text-white/90 hover:bg-white/5">
              View storefront
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
