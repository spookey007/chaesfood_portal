import { revalidatePath } from "next/cache";
import { syncCartLinesBodySchema } from "@/lib/checkout-cart-lines-schema";
import { replaceDraftOrderWithLines } from "@/lib/cart-service";

/** Push browser cart into the server draft (optional; checkout can also replace lines in one request). */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { lines } = syncCartLinesBodySchema.parse(json);
    await replaceDraftOrderWithLines(lines);
    revalidatePath("/cart");
    revalidatePath("/admin/orders");
    return Response.json({ ok: true as const });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return Response.json({ ok: false as const, error: message }, { status: 400 });
  }
}
