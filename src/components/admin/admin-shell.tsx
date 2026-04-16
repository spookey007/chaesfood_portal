"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { AdminPortalFooter, AdminPortalHeader } from "@/components/admin/admin-portal-chrome";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-[#0b1020] text-white">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0c1328] lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            CF
          </span>
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Staff portal</p>
            <p className="font-heading text-sm font-extrabold text-white">Chae&apos;s Food</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="relative block rounded-lg px-3 py-2.5">
                {active ? (
                  <motion.span
                    layoutId="adminNavPill"
                    className="absolute inset-0 rounded-lg bg-primary/20 ring-1 ring-primary/40"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-3 text-sm font-semibold">
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : "text-white/55"}`} strokeWidth={1.75} />
                  <span className={active ? "text-white" : "text-white/70"}>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/products"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            View storefront
          </Link>
          <Link
            href="/"
            className="mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
          >
            Marketing home
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f4f5f8] text-foreground">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-black/10 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white text-foreground"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <span className="font-heading text-sm font-extrabold text-foreground">Admin</span>
          <span className="w-10" />
        </header>

        <AdminPortalHeader />

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              transition={{ duration: 0.28, ease }}
              className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col border-r border-white/10 bg-[#0c1328] text-white shadow-2xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <span className="font-heading text-sm font-bold">Menu</span>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 p-3">
                {nav.map((item) => {
                  const active =
                    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                        active ? "bg-primary/20 text-white ring-1 ring-primary/40" : "text-white/70"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/10 p-3">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </div>
        ) : null}

        <main className="min-w-0 max-w-full flex-1 overflow-x-auto px-3 py-6 text-foreground sm:px-6 sm:py-8 md:px-8">
          {children}
        </main>
        <AdminPortalFooter />
      </div>
    </div>
  );
}
