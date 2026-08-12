import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  diningCategoryToClient,
  type DiningCategory,
} from "@/lib/dining";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const patch = (await req.json()) as Partial<Omit<DiningCategory, "items">>;
    const existing = await prisma.diningCategory.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.diningCategory.update({
      where: { id: params.id },
      data: {
        nameEn: patch.name?.en ?? existing.nameEn,
        nameTh: patch.name?.th ?? existing.nameTh,
        image: patch.image ?? existing.image,
        order: patch.order ?? existing.order,
        published: patch.published ?? existing.published,
      },
      include: { items: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(diningCategoryToClient(updated));
  } catch (e) {
    console.error("[api/dining/categories PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    // Dishes cascade at the DB level (onDelete: Cascade).
    await prisma.diningCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/dining/categories DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
