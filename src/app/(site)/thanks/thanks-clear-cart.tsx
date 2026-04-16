"use client";

import { useEffect } from "react";
import { useStorefrontCart } from "@/contexts/storefront-cart-context";

/** Clear browser cart after a successful order (Muretti-style local cart lifecycle). */
export function ThanksClearCart() {
  const { clear } = useStorefrontCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
