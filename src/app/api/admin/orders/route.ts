import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const orders = await prisma.order.findMany({
    where: { status: { not: OrderStatus.DRAFT } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: {
        select: {
          id: true,
          lineSku: true,
          productName: true,
          productId: true,
          variationExternalId: true,
          imageFolder: true,
          imageFile: true,
          quantity: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
      },
    },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      reference: o.reference,
      status: o.status,
      paymentType: o.paymentType,
      paymentStatus: o.paymentStatus,
      totalCents: o.totalCents,
      currency: o.currency,
      note: o.note,
      deliveryAddress: o.deliveryAddress,
      guestName: o.guestName,
      guestEmail: o.guestEmail,
      guestPhone: o.guestPhone,
      user: o.user,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items,
    })),
  });
}
