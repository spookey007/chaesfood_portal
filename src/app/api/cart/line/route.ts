import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  appendLineToCurrentDraft,
  getCurrentDraftOrder,
  setLineQuantityOnCurrentDraft,
  type DraftOrderWithItems,
} from "@/lib/cart-service";

export type SerializedCartOrder = {
  id: string;
  reference: string;
  totalCents: number;
  items: {
    id: string;
    productSku: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

function serializeOrder(order: DraftOrderWithItems): SerializedCartOrder {
  return {
    id: order.id,
    reference: order.reference,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      id: i.id,
      productSku: i.lineSku,
      productName: i.productName,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: i.lineTotalCents,
    })),
  };
}

function cartSummary(order: DraftOrderWithItems | null) {
  if (!order) return { count: 0, totalCents: 0 };
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return { count, totalCents: order.totalCents };
}

function revalidateCartPaths() {
  revalidatePath("/products");
  revalidatePath("/cart");
  revalidatePath("/admin/orders");
}

const postBody = z.object({
  productId: z.string().min(1),
  variationId: z.string().nullable().optional(),
});

/** Fast JSON add-to-cart (POST /api/cart/line) — avoids Server Action POST to the current page. */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { productId, variationId } = postBody.parse(json);
    const order = await appendLineToCurrentDraft(productId, variationId ?? null);
    revalidateCartPaths();
    const resolved = order ?? (await getCurrentDraftOrder());
    return Response.json({
      ok: true as const,
      ...cartSummary(resolved),
      order: resolved ? serializeOrder(resolved) : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not add to cart";
    const status = message === "Product not found" ? 404 : 400;
    return Response.json({ ok: false as const, error: message }, { status });
  }
}

const patchBody = z.object({
  productSku: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

export async function PATCH(request: Request) {
  try {
    const json: unknown = await request.json();
    const { productSku, quantity } = patchBody.parse(json);
    const order = await setLineQuantityOnCurrentDraft(productSku, quantity);
    revalidateCartPaths();
    const resolved = order ?? (await getCurrentDraftOrder());
    return Response.json({
      ok: true as const,
      ...cartSummary(resolved),
      order: resolved ? serializeOrder(resolved) : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not update cart";
    return Response.json({ ok: false as const, error: message }, { status: 400 });
  }
}
