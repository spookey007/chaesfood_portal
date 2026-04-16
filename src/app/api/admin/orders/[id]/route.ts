import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/require-admin";

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const order = await prisma.order.findFirst({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = await Promise.all(
    order.items.map(async (item) => {
      let variationName: string | null = null;
      if (item.productId && item.variationExternalId) {
        const v = await prisma.productVariation.findUnique({
          where: {
            productId_externalId: {
              productId: item.productId,
              externalId: item.variationExternalId,
            },
          },
          select: { name: true },
        });
        variationName = v?.name ?? null;
      }
      return {
        id: item.id,
        lineSku: item.lineSku,
        productName: item.productName,
        productId: item.productId,
        variationExternalId: item.variationExternalId,
        variationName,
        imageFolder: item.imageFolder,
        imageFile: item.imageFile,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
      };
    }),
  );

  return NextResponse.json({
    order: {
      id: order.id,
      reference: order.reference,
      status: order.status,
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
      totalCents: order.totalCents,
      currency: order.currency,
      note: order.note,
      deliveryAddress: order.deliveryAddress,
      guestName: order.guestName,
      guestEmail: order.guestEmail,
      guestPhone: order.guestPhone,
      user: order.user,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        user: { select: { email: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        reference: order.reference,
        status: order.status,
        paymentType: order.paymentType,
        paymentStatus: order.paymentStatus,
        totalCents: order.totalCents,
        currency: order.currency,
        note: order.note,
        deliveryAddress: order.deliveryAddress,
        user: order.user,
        guestName: order.guestName,
        guestEmail: order.guestEmail,
        guestPhone: order.guestPhone,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          lineSku: item.lineSku,
          productName: item.productName,
          productId: item.productId,
          variationExternalId: item.variationExternalId,
          imageFolder: item.imageFolder,
          imageFile: item.imageFile,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
