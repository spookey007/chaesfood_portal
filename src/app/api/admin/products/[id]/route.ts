import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { invalidateReadCatalogCache } from "@/lib/catalog";
import { requireAdmin } from "@/lib/require-admin";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  imageAlt: z.string().max(500).nullable().optional(),
  description: z.string().max(20_000).nullable().optional(),
  requiresVariation: z.boolean().optional(),
});

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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const data: Prisma.ProductUpdateInput = {};
  if (d.name !== undefined) data.name = d.name;
  if (d.slug !== undefined) data.slug = d.slug;
  if (d.priceCents !== undefined) data.priceCents = d.priceCents;
  if (d.imageAlt !== undefined) data.imageAlt = d.imageAlt;
  if (d.description !== undefined) data.description = d.description;
  if (d.requiresVariation !== undefined) data.requiresVariation = d.requiresVariation;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, _count: { select: { variations: true } } },
    });

    invalidateReadCatalogCache();

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        priceCents: product.priceCents,
        categoryId: product.categoryId,
        categoryTitle: product.category.title,
        imageFolder: product.imageFolder,
        imageFile: product.imageFile,
        imageAlt: product.imageAlt,
        description: product.description,
        requiresVariation: product.requiresVariation,
        variationCount: product._count.variations,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Product not found or update failed" }, { status: 404 });
  }
}
