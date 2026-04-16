import { checkoutJsonSchema } from "@/lib/checkout-cart-lines-schema";
import {
  assertCheckoutOrigin,
  checkoutBodyTooLarge,
  checkoutClientFingerprint,
  checkoutRateLimitAllow,
} from "@/lib/checkout-security";
import { finalizeCheckoutFromClientLines } from "@/lib/checkout-service";

export async function POST(request: Request) {
  if (checkoutBodyTooLarge(request)) {
    return Response.json({ ok: false as const, error: "Request body too large." }, { status: 413 });
  }

  const originCheck = assertCheckoutOrigin(request);
  if (!originCheck.ok) {
    return Response.json({ ok: false as const, error: originCheck.message }, { status: originCheck.status });
  }

  const fp = checkoutClientFingerprint(request);
  if (!checkoutRateLimitAllow(fp)) {
    return Response.json({ ok: false as const, error: "Too many checkout attempts. Try again shortly." }, {
      status: 429,
    });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false as const, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = checkoutJsonSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false as const, error: "Invalid checkout payload." }, { status: 400 });
  }

  const { lines, paymentType, guestName, guestEmail, deliveryAddress, note } = parsed.data;

  const result = await finalizeCheckoutFromClientLines({
    lines,
    paymentType,
    guestName,
    guestEmail,
    deliveryAddress,
    note,
  });

  if (!result.ok) {
    return Response.json({ ok: false as const, error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true as const, reference: result.reference, orderId: result.orderId });
}
