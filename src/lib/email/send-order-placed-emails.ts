import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { buildAdminNewOrderEmail, buildCustomerOrderEmail, type OrderEmailPayload } from "@/lib/email/order-email-templates";

function stringifyResendError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function usesResendOnboardingFrom(from: string): boolean {
  return from.toLowerCase().includes("onboarding@resend.dev");
}

/** Hosting env UIs often add extra quotes or line breaks around RESEND_FROM — Resend then rejects the `from` field. */
function normalizeResendFrom(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if ((s.startsWith("\u201c") && s.endsWith("\u201d")) || (s.startsWith("\u2018") && s.endsWith("\u2019"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/\s*[\r\n]+\s*/g, " ").replace(/\t+/g, " ").replace(/ +/g, " ").trim();
  return s;
}

/** Resend: `email@example.com` or `Name <email@example.com>`. */
function isValidResendFromFormat(s: string): boolean {
  const emailOk = (addr: string) => /^[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+$/.test(addr.trim());
  if (emailOk(s)) return true;
  const m = /^(.+) <([^>]+)>$/.exec(s);
  if (!m) return false;
  return emailOk(m[2]);
}

function resendErrorMentionsInvalidFrom(msg: string): boolean {
  return /invalid `from` field|invalid from field/i.test(msg);
}

function logInvalidResendFromHint(from: string): void {
  console.error(
    "[order-email] RESEND_FROM failed Resend format checks. Expected: orders@yourdomain.com OR \"Chaes Food <orders@yourdomain.com>\" (no extra outer quotes in the dashboard). Normalized value as JSON:",
    JSON.stringify(from),
  );
}

function publicAppOrigin(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!raw) return undefined;
  try {
    return new URL(raw).origin;
  } catch {
    return undefined;
  }
}

function mapOrderForEmail(
  row: NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>,
): OrderEmailPayload {
  return {
    id: row.id,
    reference: row.reference,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    deliveryAddress: row.deliveryAddress,
    note: row.note,
    totalCents: row.totalCents,
    currency: row.currency,
    status: row.status,
    paymentType: row.paymentType,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt,
    items: row.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      lineTotalCents: it.lineTotalCents,
    })),
  };
}

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

/** Sends customer + admin transactional emails after checkout. Never throws to callers. */
export async function sendOrderPlacedEmails(orderId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  /** Single verified sender for both checkout emails (customer + admin). */
  const from = normalizeResendFrom(process.env.RESEND_FROM ?? "");

  if (!apiKey) {
    console.warn("[order-email] RESEND_API_KEY is not set; skipping transactional emails.");
    return;
  }
  if (!from) {
    console.warn("[order-email] RESEND_FROM is not set; skipping transactional emails (same `from` is used for customer and admin).");
    return;
  }
  if (!isValidResendFromFormat(from)) {
    logInvalidResendFromHint(from);
    return;
  }

  const row = await loadOrderForEmail(orderId);
  const guestEmail = row?.guestEmail?.trim();
  if (!row || !guestEmail) {
    return;
  }

  const order = mapOrderForEmail(row);
  const origin = publicAppOrigin();
  const thanksUrl = origin
    ? `${origin}/thanks?${new URLSearchParams({ ref: order.reference, id: order.id }).toString()}`
    : undefined;
  const adminOrdersUrl = origin ? `${origin}/admin/orders` : undefined;

  const customer = buildCustomerOrderEmail(order, { thanksUrl });
  const admin = buildAdminNewOrderEmail(order, { adminOrdersUrl });

  const adminRecipientsRaw =
    process.env.ADMIN_RECIPIENT?.trim() ||
    process.env.ORDER_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim();
  const adminTo = adminRecipientsRaw
    ? [...new Set(adminRecipientsRaw.split(",").map((e) => e.trim()).filter(Boolean))]
    : [];

  const resend = new Resend(apiKey);

  const customerResult = await resend.emails.send({
    from,
    to: guestEmail,
    subject: customer.subject,
    html: customer.html,
    text: customer.text,
  });
  if (customerResult.error) {
    const cmsg = stringifyResendError(customerResult.error);
    console.error("[order-email] Customer send failed:", cmsg);
    if (resendErrorMentionsInvalidFrom(cmsg)) {
      logInvalidResendFromHint(from);
    } else if (usesResendOnboardingFrom(from)) {
      console.error(
        "[order-email] Resend test sender (onboarding@resend.dev) only delivers to your Resend-account email. " +
          "Verify a domain and use RESEND_FROM on that domain for arbitrary recipients.",
      );
    }
  }

  if (adminTo.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[order-email] No admin inbox configured. Set ADMIN_RECIPIENT (or ORDER_NOTIFY_EMAIL / ADMIN_EMAIL).",
      );
    }
    return;
  }

  const adminResult = await resend.emails.send({
    from,
    to: adminTo.length === 1 ? adminTo[0]! : adminTo,
    subject: admin.subject,
    html: admin.html,
    text: admin.text,
  });
  if (adminResult.error) {
    const amsg = stringifyResendError(adminResult.error);
    console.error("[order-email] Admin send failed:", amsg, { to: adminTo });
    if (resendErrorMentionsInvalidFrom(amsg)) {
      logInvalidResendFromHint(from);
    } else if (usesResendOnboardingFrom(from)) {
      console.error(
        "[order-email] Resend test sender (onboarding@resend.dev) only delivers to your Resend-account email. " +
          "Verify a domain at resend.com/domains, set RESEND_FROM to an address on that domain, then ADMIN_RECIPIENT can be any address.",
      );
    }
  }
}
