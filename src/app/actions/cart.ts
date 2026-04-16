"use server";

import { revalidatePath } from "next/cache";
import {
  appendLineToCurrentDraft,
  clearCurrentDraftOrder,
  getCurrentDraftOrder,
  setLineQuantityOnCurrentDraft,
} from "@/lib/cart-service";

export async function getCart() {
  return getCurrentDraftOrder();
}

/** @deprecated use getCart */
export async function getCartForUser() {
  return getCart();
}

export async function addToCart(productId: string, variationId?: string | null) {
  await appendLineToCurrentDraft(productId, variationId);
  revalidatePath("/products");
  revalidatePath("/cart");
  revalidatePath("/admin/orders");
}

export async function setCartLineQuantity(productSku: string, quantity: number) {
  await setLineQuantityOnCurrentDraft(productSku, quantity);
  revalidatePath("/products");
  revalidatePath("/cart");
  revalidatePath("/admin/orders");
}

export async function clearCart() {
  await clearCurrentDraftOrder();
  revalidatePath("/cart");
  revalidatePath("/admin/orders");
}
