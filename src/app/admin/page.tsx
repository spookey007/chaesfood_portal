import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminOverviewPage() {
  const [userCount, productCount, placedOrderCount, pendingCount, paidAgg] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count({ where: { status: { not: OrderStatus.DRAFT } } }),
    prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
    prisma.order.aggregate({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] } },
      _sum: { totalCents: true },
    }),
  ]);

  return (
    <AdminDashboard
      stats={{
        userCount,
        productCount,
        placedOrderCount,
        pendingPaymentCount: pendingCount,
        revenueCents: paidAgg._sum.totalCents ?? 0,
      }}
    />
  );
}
