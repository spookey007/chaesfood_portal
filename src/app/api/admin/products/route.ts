import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const rows = await prisma.product.findMany({
    include: {
      category: true,
      _count: { select: { variations: true } },
    },
    orderBy: [{ categoryId: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceCents: p.priceCents,
      categoryId: p.categoryId,
      categoryTitle: p.category.title,
      imageFolder: p.imageFolder,
      imageFile: p.imageFile,
      imageAlt: p.imageAlt,
      description: p.description,
      requiresVariation: p.requiresVariation,
      variationCount: p._count.variations,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}
