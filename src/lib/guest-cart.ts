import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";

export const GUEST_CART_COOKIE = "chaesfood_guest_cart";

export async function getGuestDraftOrder() {
  const id = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  if (!id) return null;
  return prisma.order.findFirst({
    where: { id, userId: null, status: OrderStatus.DRAFT },
    include: { items: true },
  });
}

export async function setGuestCartCookie(orderId: string) {
  (await cookies()).set(GUEST_CART_COOKIE, orderId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearGuestCartCookie() {
  (await cookies()).delete(GUEST_CART_COOKIE);
}
