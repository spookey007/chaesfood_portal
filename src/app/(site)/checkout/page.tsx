import type { Metadata } from "next";
import { CheckoutPageClient } from "./checkout-page-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Choose payment and delivery details for your Chaes Food order.",
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
