import { getCurrentDraftOrder } from "@/lib/cart-service";

/** Lightweight cart counts (same DB read as GET /api/cart — prefer client localStorage count when possible). */
export async function GET() {
  const order = await getCurrentDraftOrder();

  if (!order) {
    return Response.json({ count: 0, totalCents: 0 });
  }

  const count = order.items.reduce((sum, i) => sum + i.quantity, 0);
  return Response.json({ count, totalCents: order.totalCents });
}
