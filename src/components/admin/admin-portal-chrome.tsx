"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function AdminPortalHeader() {
  const { data } = useSession();
  return (
    <header className="sticky top-0 z-30 hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-black/10 bg-white/95 px-6 shadow-sm backdrop-blur-md lg:flex">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Chae&apos;s Food</p>
        <p className="font-heading text-sm font-extrabold text-foreground">Store operations</p>
      </div>
      <p className="max-w-[min(100%,20rem)] truncate text-right text-xs text-muted">
        {data?.user?.email ?? "—"}
      </p>
    </header>
  );
}

export function AdminPortalFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-black/10 bg-white px-4 py-4 text-center text-[11px] text-muted sm:px-6">
      <span className="font-medium text-foreground/80">Staff portal</span>
      {" · "}
      Internal use only.{" "}
      <Link href="/products" className="font-semibold text-primary hover:underline">
        Open storefront
      </Link>
      {" · "}
      <Link href="/" className="font-semibold text-primary hover:underline">
        Marketing site
      </Link>
    </footer>
  );
}
