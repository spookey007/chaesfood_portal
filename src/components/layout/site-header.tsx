"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LayoutGrid, Menu, Phone, X } from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
import { CartBadge } from "@/components/cart/cart-badge";

const productCategories = [
  { href: "/products?storage=fresh", label: "Fresh" },
  { href: "/products?storage=frozen", label: "Frozen" },
  { href: "/products?storage=dry", label: "Dry" },
];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/employment", label: "Employment" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsWrapRef = useRef<HTMLDivElement>(null);
  const onAuthPage = pathname === "/login" || pathname === "/register";
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!productsWrapRef.current?.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function linkClass(href: string) {
    const active =
      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    return `rounded-md px-2.5 py-2 text-[15px] font-bold tracking-tight transition-colors lg:px-3 ${
      active ? "text-primary" : "text-foreground hover:text-primary"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white pt-[env(safe-area-inset-top,0px)] shadow-sm">
      <div className="border-b border-black/[0.06] bg-[#f5f6f8] sm:bg-surface-muted/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-3 py-2 text-sm sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:justify-start">
            <a
              href="tel:2154259999"
              className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              215-425-9999
            </a>
            <span className="hidden text-muted md:inline">2100 N. American St, Philadelphia, PA 19122</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/chaesfood/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted transition hover:text-primary"
              aria-label="Chaes Food on Facebook"
            >
              <FacebookIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[76px] sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-md border border-black/10 bg-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
          <Link href="/" className="flex min-w-0 shrink-0 items-center">
            <span className="relative h-[52px] w-[140px] overflow-hidden sm:h-[55px] sm:w-[150px]">
              <Image
                src="/logo.png"
                alt="Chaes Food LLC"
                fill
                className="object-contain object-left p-0.5"
                sizes="150px"
                priority
              />
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          <div className="relative" ref={productsWrapRef}>
            <button
              type="button"
              onClick={() => setProductsOpen((v) => !v)}
              className={`flex items-center gap-0.5 rounded-md px-2.5 py-2 text-[15px] font-bold lg:px-3 ${
                pathname.startsWith("/products") ? "text-primary" : "text-foreground hover:text-primary"
              }`}
              aria-expanded={productsOpen}
              aria-haspopup="menu"
            >
              Products
              <ChevronDown className={`h-4 w-4 shrink-0 transition ${productsOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            {productsOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-md border border-black/10 bg-white py-1 shadow-lg"
                role="menu"
              >
                {productCategories.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-primary/5 hover:text-primary"
                    onClick={() => setProductsOpen(false)}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/daily-specials"
            className="hidden whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-[color:var(--primary-hover)] sm:inline-flex sm:text-sm"
          >
            Daily Special
          </Link>
          <CartBadge />
          <Link
            href="/cart"
            className="hidden rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-[color:var(--primary-hover)] sm:inline-flex"
          >
            Checkout
          </Link>
          {status === "loading" ? (
            <span className="h-9 w-20 animate-pulse rounded-lg bg-surface-muted" />
          ) : session ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-2 text-xs font-bold text-primary transition hover:bg-primary/15 sm:gap-1.5 sm:px-3 sm:text-sm"
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-black/10 bg-white px-2 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-surface-muted sm:px-3 sm:text-sm"
              >
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </>
          ) : onAuthPage ? (
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              Home
            </Link>
          ) : (
            <Link
              href="/login?callbackUrl=/admin"
              className="rounded-lg border border-black/10 bg-white px-2.5 py-2 text-xs font-bold text-foreground shadow-sm transition hover:border-primary/30 hover:text-primary sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">Staff login</span>
              <span className="sm:hidden">Staff</span>
            </Link>
          )}
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/5 bg-white lg:hidden">
          <nav className="flex max-h-[min(72vh,560px)] flex-col gap-0.5 overflow-y-auto px-3 py-3">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-bold text-foreground hover:bg-primary/5 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Products</p>
            {productCategories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-base font-bold text-foreground hover:bg-primary/5 hover:text-primary"
              >
                {c.label}
              </Link>
            ))}
            <Link
              href="/daily-specials"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-primary px-4 py-3 text-center text-base font-bold text-primary-foreground"
            >
              Daily Special
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border-2 border-primary bg-white px-4 py-3 text-center text-base font-bold text-primary"
            >
              Checkout
            </Link>
            {!session ? (
              <Link
                href="/login?callbackUrl=/admin"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-bold text-muted hover:text-foreground"
              >
                Staff login
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
