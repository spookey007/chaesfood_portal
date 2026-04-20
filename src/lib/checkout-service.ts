import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, PaymentType } from "@/generated/prisma/enums";
import { clearGuestCartCookie } from "@/lib/guest-cart";
import {
  getCurrentDraftOrder,
  replaceDraftOrderWithLines,
  type SyncCartLineInput,
} from "@/lib/cart-service";
import { sendOrderPlacedEmails } from "@/lib/email/send-order-placed-emails";

export type CheckoutResult =
  | { ok: true; reference: string; orderId: string }
  | { ok: false; error: string };

export type ValidatedCheckoutContact = { name: string; email: string; address: string; note: string };

export type CheckoutContactValidation =
  | { ok: true; contact: ValidatedCheckoutContact }
  | { ok: false; error: string };

function orderRef() {
  return `CF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

type ContactFields = {
  guestName?: string;
  guestEmail?: string;
  deliveryAddress: string;
  note?: string;
};

export function validateCheckoutContact(session: Session | null, raw: ContactFields): CheckoutContactValidation {
  let contactName = (raw.guestName ?? "").trim();
  let contactEmail = (raw.guestEmail ?? "").trim();
  if (session?.user) {
    if (!contactName) contactName = session.user.name?.trim() ?? "";
    if (!contactEmail) contactEmail = session.user.email ?? "";
  }

  if (contactName.length < 2) {
    return { ok: false, error: "Please enter your name (at least 2 characters)." };
  }
  const emailParsed = z.string().email().safeParse(contactEmail);
  if (!emailParsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const address = (raw.deliveryAddress ?? "").trim();
  const note = (raw.note ?? "").trim();
  if (address.length < 8) {
    return { ok: false, error: "Please enter a full delivery address." };
  }

  return {
    ok: true,
    contact: {
      name: contactName,
      email: emailParsed.data,
      address,
      note,
    },
  };
}

async function promoteDraftToPlacedOrder(
  orderId: string,
  contact: ValidatedCheckoutContact,
  session: Session | null,
  paymentType: PaymentType,
  initialPaymentStatus: PaymentStatus,
): Promise<CheckoutResult> {
  const newRef = orderRef();
  await prisma.order.update({
    where: { id: orderId },
    data: {
      reference: newRef,
      status: OrderStatus.PENDING_PAYMENT,
      paymentType,
      paymentStatus: initialPaymentStatus,
      deliveryAddress: contact.address,
      note: contact.note || null,
      guestName: contact.name,
      guestEmail: contact.email,
    },
  });

  void sendOrderPlacedEmails(orderId).catch((err) => {
    console.error("[order-email] Failed to send order emails:", err);
  });

  if (!session?.user?.id) {
    await clearGuestCartCookie();
  }

  revalidatePath("/admin/orders");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/thanks");

  return { ok: true, reference: newRef, orderId };
}

/** Sync client cart lines to the server draft, then place the order with the chosen payment type. */
export async function finalizeCheckoutFromClientLines(
  input: { lines: SyncCartLineInput[]; paymentType: PaymentType } & ContactFields,
): Promise<CheckoutResult> {
  if (input.paymentType === PaymentType.ONLINE_CARD) {
    return { ok: false, error: "Card checkout is not available yet. Please choose cash on delivery." };
  }

  const session = await auth();
  const validated = validateCheckoutContact(session, input);
  if (!validated.ok) {
    return validated;
  }

  let draft;
  try {
    draft = await replaceDraftOrderWithLines(input.lines);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not validate cart.";
    return { ok: false, error: message };
  }

  if (!draft || draft.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  return promoteDraftToPlacedOrder(draft.id, validated.contact, session, input.paymentType, PaymentStatus.PENDING);
}

/** Place order from the current server draft (cart already synced). */
export async function finalizeCheckoutFromExistingDraft(
  input: ContactFields & { paymentType: PaymentType },
): Promise<CheckoutResult> {
  if (input.paymentType === PaymentType.ONLINE_CARD) {
    return { ok: false, error: "Card checkout is not available yet. Please choose cash on delivery." };
  }

  const session = await auth();
  const validated = validateCheckoutContact(session, input);
  if (!validated.ok) {
    return validated;
  }

  const draft = await getCurrentDraftOrder();
  if (!draft || draft.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  return promoteDraftToPlacedOrder(draft.id, validated.contact, session, input.paymentType, PaymentStatus.PENDING);
}
