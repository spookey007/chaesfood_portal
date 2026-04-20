import type { OrderStatus, PaymentStatus, PaymentType } from "@/generated/prisma/enums";

/** Order row plus line items as loaded for transactional email. */
export type OrderEmailPayload = {
  id: string;
  reference: string;
  guestName: string | null;
  guestEmail: string | null;
  deliveryAddress: string | null;
  note: string | null;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  paymentType: PaymentType | null;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  items: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMoney(cents: number, currency: string): string {
  const code = currency?.trim() || "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
}

function paymentLabel(type: PaymentType | null | undefined): string {
  if (type === "CASH_ON_DELIVERY") return "Cash on delivery";
  if (type === "ONLINE_CARD") return "Card (online)";
  return "—";
}

function paymentStatusLabel(s: PaymentStatus): string {
  const map: Record<string, string> = {
    NOT_APPLICABLE: "Not applicable",
    PENDING: "Pending",
    REQUIRES_ACTION: "Action required",
    PROCESSING: "Processing",
    SUCCEEDED: "Succeeded",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partially refunded",
  };
  return map[s] ?? s;
}

function orderStatusLabel(status: OrderStatus): string {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_PAYMENT: "Pending payment",
    PAID: "Paid",
    FULFILLED: "Fulfilled",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\r\n|\n|\r/g, "<br />");
}

const brand = {
  blue: "#1086ff",
  blueDark: "#0d6fe0",
  footer: "#0c1328",
  footerMuted: "#9aa0ae",
  surface: "#f4f7fb",
  text: "#1a1d21",
  muted: "#5c6168",
  border: "#e2e8f0",
};

function layoutShell(opts: { preheader: string; title: string; inner: string; footerNote: string }): string {
  const { preheader, title, inner, footerNote } = opts;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.surface};font-family:Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif;color:${brand.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.surface};">
    <tr>
      <td align="center" style="padding:28px 14px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(15, 23, 42, 0.08);">
          <tr>
            <td style="background:linear-gradient(135deg, ${brand.blue} 0%, ${brand.blueDark} 100%);padding:26px 28px 22px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.88);font-weight:600;">Chaes Food</p>
              <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;font-weight:700;color:#ffffff;font-family:Mulish, Roboto, Arial, sans-serif;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px 8px;font-size:15px;line-height:1.55;color:${brand.text};">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 26px;font-size:12px;line-height:1.5;color:${brand.muted};border-top:1px solid ${brand.border};">
              <p style="margin:16px 0 0;">${footerNote}</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:${brand.muted};max-width:600px;">© ${new Date().getFullYear()} Chaes Food. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsTableHtml(order: OrderEmailPayload): string {
  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:12px 10px;border-bottom:1px solid ${brand.border};font-size:14px;">${escapeHtml(it.productName)}</td>
        <td style="padding:12px 10px;border-bottom:1px solid ${brand.border};font-size:14px;text-align:center;width:48px;">${it.quantity}</td>
        <td style="padding:12px 10px;border-bottom:1px solid ${brand.border};font-size:14px;text-align:right;white-space:nowrap;">${escapeHtml(formatMoney(it.unitPriceCents, order.currency))}</td>
        <td style="padding:12px 10px;border-bottom:1px solid ${brand.border};font-size:14px;text-align:right;font-weight:600;white-space:nowrap;">${escapeHtml(formatMoney(it.lineTotalCents, order.currency))}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${brand.border};border-radius:10px;overflow:hidden;margin:18px 0 0;">
    <thead>
      <tr style="background:${brand.surface};">
        <th align="left" style="padding:10px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${brand.muted};">Item</th>
        <th style="padding:10px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${brand.muted};">Qty</th>
        <th align="right" style="padding:10px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${brand.muted};">Each</th>
        <th align="right" style="padding:10px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${brand.muted};">Line</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" align="right" style="padding:14px 12px;font-size:14px;font-weight:600;">Total</td>
        <td align="right" style="padding:14px 12px;font-size:16px;font-weight:700;color:${brand.blue};">${escapeHtml(formatMoney(order.totalCents, order.currency))}</td>
      </tr>
    </tfoot>
  </table>`;
}

function metaRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${brand.muted};width:140px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:${brand.text};">${value}</td>
  </tr>`;
}

export function buildCustomerOrderEmail(
  order: OrderEmailPayload,
  opts: { thanksUrl?: string },
): { subject: string; html: string; text: string } {
  const name = order.guestName?.trim() || "there";
  const ref = order.reference;
  const subject = `Thank you — order ${ref} is confirmed`;
  const thanksLink = opts.thanksUrl
    ? `<p style="margin:18px 0 0;"><a href="${escapeHtml(opts.thanksUrl)}" style="display:inline-block;background:${brand.blue};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">View order confirmation</a></p>`
    : "";

  const inner = `<p style="margin:0 0 14px;font-size:16px;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 18px;">Thank you for placing your order with Chaes Food. We have received it and will prepare everything with care.</p>
<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${brand.muted};letter-spacing:0.04em;text-transform:uppercase;">Order reference</p>
<p style="margin:0 0 4px;font-size:20px;font-weight:700;color:${brand.blue};letter-spacing:0.02em;">${escapeHtml(ref)}</p>
${thanksLink}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;">
  ${metaRow("Email", escapeHtml(order.guestEmail ?? ""))}
  ${metaRow("Delivery address", nl2br(order.deliveryAddress ?? "—"))}
  ${metaRow("Payment", escapeHtml(paymentLabel(order.paymentType)))}
  ${order.note ? metaRow("Your note", nl2br(order.note)) : ""}
</table>
${itemsTableHtml(order)}`;

  const text = [
    `Hi ${name},`,
    "",
    "Thank you for placing your order with Chaes Food.",
    "",
    `Order reference: ${ref}`,
    opts.thanksUrl ? `Confirmation page: ${opts.thanksUrl}` : "",
    "",
    `Email: ${order.guestEmail ?? ""}`,
    `Delivery address: ${order.deliveryAddress ?? "—"}`,
    `Payment: ${paymentLabel(order.paymentType)}`,
    order.note ? `Note: ${order.note}` : "",
    "",
    "Items:",
    ...order.items.map(
      (it) =>
        `  - ${it.productName} × ${it.quantity} @ ${formatMoney(it.unitPriceCents, order.currency)} = ${formatMoney(it.lineTotalCents, order.currency)}`,
    ),
    "",
    `Total: ${formatMoney(order.totalCents, order.currency)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html: layoutShell({
      preheader: `Your order ${ref} is confirmed. Thank you for choosing Chaes Food.`,
      title: "Your order is confirmed",
      inner,
      footerNote:
        "If you have questions about this order, reply to this email or contact us through our website.",
    }),
    text,
  };
}

export function buildAdminNewOrderEmail(
  order: OrderEmailPayload,
  opts: { adminOrdersUrl?: string },
): { subject: string; html: string; text: string } {
  const ref = order.reference;
  const subject = `New order ${ref} — action may be needed`;
  const adminCta = opts.adminOrdersUrl
    ? `<p style="margin:18px 0 0;"><a href="${escapeHtml(opts.adminOrdersUrl)}" style="display:inline-block;background:${brand.footer};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">Open admin orders</a></p>`
    : "";

  const inner = `<p style="margin:0 0 14px;font-size:16px;">You have received a new order on Chaes Food.</p>
<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${brand.muted};letter-spacing:0.04em;text-transform:uppercase;">Order reference</p>
<p style="margin:0 0 4px;font-size:20px;font-weight:700;color:${brand.blue};letter-spacing:0.02em;">${escapeHtml(ref)}</p>
<p style="margin:6px 0 0;font-size:13px;color:${brand.muted};">Internal id: <code style="background:${brand.surface};padding:2px 6px;border-radius:4px;font-size:12px;">${escapeHtml(order.id)}</code></p>
${adminCta}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;">
  ${metaRow("Customer", escapeHtml(order.guestName ?? "—"))}
  ${metaRow("Email", escapeHtml(order.guestEmail ?? "—"))}
  ${metaRow("Delivery address", nl2br(order.deliveryAddress ?? "—"))}
  ${metaRow("Status", escapeHtml(orderStatusLabel(order.status)))}
  ${metaRow("Payment type", escapeHtml(paymentLabel(order.paymentType)))}
  ${metaRow("Payment status", escapeHtml(paymentStatusLabel(order.paymentStatus)))}
  ${order.note ? metaRow("Customer note", nl2br(order.note)) : ""}
</table>
${itemsTableHtml(order)}`;

  const text = [
    "You have received a new order on Chaes Food.",
    "",
    `Reference: ${ref}`,
    `Order id: ${order.id}`,
    "",
    `Customer: ${order.guestName ?? "—"}`,
    `Email: ${order.guestEmail ?? "—"}`,
    `Delivery address: ${order.deliveryAddress ?? "—"}`,
    `Status: ${orderStatusLabel(order.status)}`,
    `Payment: ${paymentLabel(order.paymentType)} / ${paymentStatusLabel(order.paymentStatus)}`,
    order.note ? `Note: ${order.note}` : "",
    "",
    "Items:",
    ...order.items.map(
      (it) =>
        `  - ${it.productName} × ${it.quantity} @ ${formatMoney(it.unitPriceCents, order.currency)} = ${formatMoney(it.lineTotalCents, order.currency)}`,
    ),
    "",
    `Total: ${formatMoney(order.totalCents, order.currency)}`,
    opts.adminOrdersUrl ? `\nAdmin: ${opts.adminOrdersUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html: layoutShell({
      preheader: `New order ${ref} from ${order.guestName ?? "customer"}.`,
      title: "New order received",
      inner,
      footerNote: "Internal notification — process this order in the admin dashboard when you are ready.",
    }),
    text,
  };
}
