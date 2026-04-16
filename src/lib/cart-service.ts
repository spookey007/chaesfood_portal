import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readCatalog } from "@/lib/catalog";
import { parseCompositeLineSku, resolveCatalogLine, priceToCents, splitRelativeImagePath } from "@/lib/catalog-shared";
import { OrderStatus } from "@/generated/prisma/enums";
import {
  clearGuestCartCookie,
  getGuestDraftOrder,
  setGuestCartCookie,
} from "@/lib/guest-cart";

const draftInclude = { items: true } as const;

function cartRef() {
  return `CART-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

async function getDraftOrderForUser(userId: string) {
  return prisma.order.findFirst({
    where: { userId, status: OrderStatus.DRAFT },
    orderBy: { updatedAt: "desc" },
    include: draftInclude,
  });
}

async function recalcTotal(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const total = items.reduce((s, i) => s + i.lineTotalCents, 0);
  await prisma.order.update({ where: { id: orderId }, data: { totalCents: total } });
}

/** Cart for the current visitor: signed-in user draft, or guest draft from cookie. */
export async function getCurrentDraftOrder() {
  const session = await auth();
  if (session?.user?.id) {
    return getDraftOrderForUser(session.user.id);
  }
  return getGuestDraftOrder();
}

export type DraftOrderWithItems = NonNullable<Awaited<ReturnType<typeof getCurrentDraftOrder>>>;

function lineSnapshotFromProduct(
  p: { id: string; image: string },
  variationExternalId: string | null,
) {
  const { folder, file } = splitRelativeImagePath(p.image);
  return {
    productId: p.id,
    variationExternalId,
    imageFolder: folder || null,
    imageFile: file || null,
  };
}

export async function appendLineToCurrentDraft(
  productId: string,
  variationId?: string | null,
): Promise<DraftOrderWithItems | null> {
  const session = await auth();
  const catalog = await readCatalog();
  const p = catalog.products.find((x) => x.id === productId);
  if (!p) throw new Error("Product not found");

  const { sku, lineName } = resolveCatalogLine(p, variationId);
  const unit = priceToCents(p.price);
  const snap = lineSnapshotFromProduct(p, parseCompositeLineSku(sku).variationId);

  if (session?.user?.id) {
    let order = await getDraftOrderForUser(session.user.id);
    if (!order) {
      order = await prisma.order.create({
        data: {
          userId: session.user.id,
          reference: cartRef(),
          totalCents: 0,
          status: OrderStatus.DRAFT,
          items: {
            create: {
              lineSku: sku,
              productId: snap.productId,
              variationExternalId: snap.variationExternalId,
              productName: lineName,
              imageFolder: snap.imageFolder,
              imageFile: snap.imageFile,
              quantity: 1,
              unitPriceCents: unit,
              lineTotalCents: unit,
            },
          },
        },
        include: draftInclude,
      });
      await recalcTotal(order.id);
    } else {
      const existing = order.items.find((i) => i.lineSku === sku);
      if (existing) {
        const qty = existing.quantity + 1;
        const line = qty * existing.unitPriceCents;
        await prisma.orderItem.update({
          where: { id: existing.id },
          data: { quantity: qty, lineTotalCents: line },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            lineSku: sku,
            productId: snap.productId,
            variationExternalId: snap.variationExternalId,
            productName: lineName,
            imageFolder: snap.imageFolder,
            imageFile: snap.imageFile,
            quantity: 1,
            unitPriceCents: unit,
            lineTotalCents: unit,
          },
        });
      }
      await recalcTotal(order.id);
    }
  } else {
    let order = await getGuestDraftOrder();
    if (!order) {
      order = await prisma.order.create({
        data: {
          userId: null,
          reference: cartRef(),
          totalCents: 0,
          status: OrderStatus.DRAFT,
          items: {
            create: {
              lineSku: sku,
              productId: snap.productId,
              variationExternalId: snap.variationExternalId,
              productName: lineName,
              imageFolder: snap.imageFolder,
              imageFile: snap.imageFile,
              quantity: 1,
              unitPriceCents: unit,
              lineTotalCents: unit,
            },
          },
        },
        include: draftInclude,
      });
      await setGuestCartCookie(order.id);
      await recalcTotal(order.id);
    } else {
      const existing = order.items.find((i) => i.lineSku === sku);
      if (existing) {
        const qty = existing.quantity + 1;
        const line = qty * existing.unitPriceCents;
        await prisma.orderItem.update({
          where: { id: existing.id },
          data: { quantity: qty, lineTotalCents: line },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            lineSku: sku,
            productId: snap.productId,
            variationExternalId: snap.variationExternalId,
            productName: lineName,
            imageFolder: snap.imageFolder,
            imageFile: snap.imageFile,
            quantity: 1,
            unitPriceCents: unit,
            lineTotalCents: unit,
          },
        });
      }
      await recalcTotal(order.id);
    }
  }

  return getCurrentDraftOrder();
}

export async function setLineQuantityOnCurrentDraft(lineSku: string, quantity: number) {
  const session = await auth();
  const order = session?.user?.id
    ? await getDraftOrderForUser(session.user.id)
    : await getGuestDraftOrder();
  if (!order) return null;

  const line = order.items.find((i) => i.lineSku === lineSku);
  if (!line) return null;

  if (quantity <= 0) {
    await prisma.orderItem.delete({ where: { id: line.id } });
  } else {
    await prisma.orderItem.update({
      where: { id: line.id },
      data: {
        quantity,
        lineTotalCents: line.unitPriceCents * quantity,
      },
    });
  }

  const remaining = await prisma.orderItem.count({ where: { orderId: order.id } });
  if (remaining === 0) {
    await prisma.order.delete({ where: { id: order.id } });
    if (!session?.user?.id) await clearGuestCartCookie();
  } else {
    await recalcTotal(order.id);
  }

  return getCurrentDraftOrder();
}

export async function clearCurrentDraftOrder() {
  const session = await auth();
  const order = session?.user?.id
    ? await getDraftOrderForUser(session.user.id)
    : await getGuestDraftOrder();
  if (!order) return;
  await prisma.order.delete({ where: { id: order.id } });
  if (!session?.user?.id) await clearGuestCartCookie();
}

export type SyncCartLineInput = {
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

/**
 * Replace the current visitor’s draft order lines with validated rows from the client cart
 * (used once at checkout — same idea as Muretti syncing only at payment).
 * Returns the refreshed draft including items (single read after writes).
 */
export async function replaceDraftOrderWithLines(lines: SyncCartLineInput[]): Promise<DraftOrderWithItems | null> {
  const catalog = await readCatalog();
  const session = await auth();

  const bucket = new Map<
    string,
    {
      lineSku: string;
      productId: string | null;
      variationExternalId: string | null;
      productName: string;
      imageFolder: string | null;
      imageFile: string | null;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }
  >();

  for (const line of lines) {
    if (line.quantity < 1 || line.quantity > 99) throw new Error("Invalid quantity");
    const { productId, variationId } = parseCompositeLineSku(line.productSku);
    const p = catalog.products.find((x) => x.id === productId);
    if (!p) throw new Error("Unknown product");
    const { sku, lineName } = resolveCatalogLine(p, variationId);
    if (sku !== line.productSku) throw new Error("Invalid line");
    const unit = priceToCents(p.price);
    if (unit !== line.unitPriceCents) throw new Error("Price does not match catalog");
    const snap = lineSnapshotFromProduct(p, variationId);
    const row = {
      lineSku: sku,
      productId: snap.productId,
      variationExternalId: snap.variationExternalId,
      productName: lineName,
      imageFolder: snap.imageFolder,
      imageFile: snap.imageFile,
      quantity: line.quantity,
      unitPriceCents: unit,
      lineTotalCents: unit * line.quantity,
    };
    const prev = bucket.get(sku);
    if (prev) {
      const qty = Math.min(99, prev.quantity + line.quantity);
      bucket.set(sku, {
        ...row,
        quantity: qty,
        lineTotalCents: unit * qty,
      });
    } else {
      bucket.set(sku, row);
    }
  }

  const finalLines = Array.from(bucket.values());
  if (finalLines.length === 0) {
    throw new Error("Cart is empty");
  }

  let orderId: string;

  if (session?.user?.id) {
    let order = await getDraftOrderForUser(session.user.id);
    if (!order) {
      order = await prisma.order.create({
        data: {
          userId: session.user.id,
          reference: cartRef(),
          totalCents: 0,
          status: OrderStatus.DRAFT,
        },
        include: draftInclude,
      });
    }
    orderId = order.id;
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.orderItem.createMany({
      data: finalLines.map((l) => ({
        orderId,
        lineSku: l.lineSku,
        productId: l.productId,
        variationExternalId: l.variationExternalId,
        productName: l.productName,
        imageFolder: l.imageFolder,
        imageFile: l.imageFile,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        lineTotalCents: l.lineTotalCents,
      })),
    });
    await recalcTotal(orderId);
  } else {
    let order = await getGuestDraftOrder();
    if (!order) {
      order = await prisma.order.create({
        data: {
          userId: null,
          reference: cartRef(),
          totalCents: 0,
          status: OrderStatus.DRAFT,
        },
        include: draftInclude,
      });
      await setGuestCartCookie(order.id);
    }
    orderId = order.id;
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.orderItem.createMany({
      data: finalLines.map((l) => ({
        orderId,
        lineSku: l.lineSku,
        productId: l.productId,
        variationExternalId: l.variationExternalId,
        productName: l.productName,
        imageFolder: l.imageFolder,
        imageFile: l.imageFile,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        lineTotalCents: l.lineTotalCents,
      })),
    });
    await recalcTotal(orderId);
  }

  return prisma.order.findFirst({
    where: { id: orderId },
    include: draftInclude,
  });
}
