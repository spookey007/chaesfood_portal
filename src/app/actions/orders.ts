"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readCatalog, priceToCents, splitRelativeImagePath } from "@/lib/catalog";
import { resolveCatalogLine } from "@/lib/catalog-shared";
import { OrderStatus, PaymentStatus, PaymentType, UserRole } from "@/generated/prisma/enums";

function ref() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CF-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export async function createSampleOrder(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) return;

  const catalog = await readCatalog();
  const product = catalog.products[0];
  if (!product) return;

  const { sku, lineName } = resolveCatalogLine(product, null);
  const unit = priceToCents(product.price);
  const qty = 1;
  const lineTotal = unit * qty;
  const { folder, file } = splitRelativeImagePath(product.image);

  await prisma.order.create({
    data: {
      userId: session.user.id,
      reference: ref(),
      totalCents: lineTotal,
      status: OrderStatus.PENDING_PAYMENT,
      paymentType: PaymentType.CASH_ON_DELIVERY,
      paymentStatus: PaymentStatus.PENDING,
      note: `Sample line: ${product.name}`,
      deliveryAddress: "Demo address — replace at checkout in real use.",
      items: {
        create: {
          lineSku: sku,
          productId: product.id,
          variationExternalId: null,
          productName: lineName,
          imageFolder: folder || null,
          imageFile: file || null,
          quantity: qty,
          unitPriceCents: unit,
          lineTotalCents: lineTotal,
        },
      },
    },
  });

  revalidatePath("/admin/orders");
}
