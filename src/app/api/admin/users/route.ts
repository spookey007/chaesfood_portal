import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      orderCount: u._count.orders,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
  });
}
