import { z } from "zod";
import { PaymentType } from "@/generated/prisma/enums";

export const syncCartLineSchema = z.object({
  productSku: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  unitPriceCents: z.number().int().min(1).max(100_000_000),
});

export const syncCartLinesBodySchema = z.object({
  lines: z.array(syncCartLineSchema).min(1),
});

export const checkoutJsonSchema = syncCartLinesBodySchema.extend({
  paymentType: z.nativeEnum(PaymentType),
  guestName: z.string().max(200).optional(),
  guestEmail: z.string().max(320).optional(),
  deliveryAddress: z.string().min(8).max(4000),
  note: z.string().max(2000).optional(),
});
