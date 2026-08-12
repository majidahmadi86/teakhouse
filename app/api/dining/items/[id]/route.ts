import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { diningItemToClient, type DiningItem } from "@/lib/dining";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const patch = (await req.json()) as Partial<DiningItem>;
    const existing = await prisma.diningItem.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.diningItem.update({
      where: { id: params.id },
      data: {
        categoryId: patch.categoryId ?? existing.categoryId,
        nameEn: patch.name?.en ?? existing.nameEn,
        nameTh: patch.name?.th ?? existing.nameTh,
        descriptionEn: patch.description?.en ?? existing.descriptionEn,
        descriptionTh: patch.description?.th ?? existing.descriptionTh,
        price: patch.price ?? existing.price,
        order: patch.order ?? existing.order,
        published: patch.published ?? existing.published,
      },
    });
    return NextResponse.json(diningItemToClient(updated));
  } catch (e) {
    console.error("[api/dining/items PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await prisma.diningItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/dining/items DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
