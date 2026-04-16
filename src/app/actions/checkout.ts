"use server";

import { PaymentType } from "@/generated/prisma/enums";
import { type CheckoutResult, finalizeCheckoutFromExistingDraft } from "@/lib/checkout-service";

export type { CheckoutResult };

/** Server action: uses the current server draft (cart already synced). Prefer `POST /api/checkout` from `/cart`. */
export async function submitCheckout(formData: FormData): Promise<CheckoutResult> {
  const guestName = String(formData.get("guestName") ?? "");
  const guestEmail = String(formData.get("guestEmail") ?? "");
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "");
  const note = String(formData.get("note") ?? "");
  const rawType = String(formData.get("paymentType") ?? PaymentType.CASH_ON_DELIVERY);
  const paymentType =
    rawType === PaymentType.ONLINE_CARD ? PaymentType.ONLINE_CARD : PaymentType.CASH_ON_DELIVERY;

  return finalizeCheckoutFromExistingDraft({
    guestName,
    guestEmail,
    deliveryAddress,
    note,
    paymentType,
  });
}
