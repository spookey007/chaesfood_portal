"use client";

import { StorefrontCartProvider } from "@/contexts/storefront-cart-context";

export function SiteStorefrontProviders({ children }: { children: React.ReactNode }) {
  return <StorefrontCartProvider>{children}</StorefrontCartProvider>;
}
