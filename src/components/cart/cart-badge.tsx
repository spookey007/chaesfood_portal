"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useStorefrontCart } from "@/contexts/storefront-cart-context";

export function CartBadge() {
  const { itemCount, hydrated } = useStorefrontCart();

  const count = hydrated ? itemCount : 0;

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-primary/20 bg-white text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 sm:h-9 sm:w-9"
      aria-label={`Cart, ${count} items`}
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
