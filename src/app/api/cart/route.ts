import { getCurrentDraftOrder } from "@/lib/cart-service";

function serializeItem(i: {
  id: string;
  lineSku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}) {
  return {
    id: i.id,
    productSku: i.lineSku,
    productName: i.productName,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
    lineTotalCents: i.lineTotalCents,
  };
}

/** Full draft cart for the cart page (guest or signed-in). */
export async function GET() {
  const order = await getCurrentDraftOrder();
  if (!order) {
    return Response.json({ order: null });
  }
  return Response.json({
    order: {
      id: order.id,
      reference: order.reference,
      totalCents: order.totalCents,
      items: order.items.map(serializeItem),
    },
  });
}
