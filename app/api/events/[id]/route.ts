import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hotelEventToClient, type HotelEvent } from "@/lib/events";
import { revalidateEvents } from "@/lib/revalidate";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const patch = (await req.json()) as Partial<HotelEvent>;
    const existing = await prisma.hotelEvent.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.hotelEvent.update({
      where: { id: params.id },
      data: {
        titleEn: patch.title?.en ?? existing.titleEn,
        titleTh: patch.title?.th ?? existing.titleTh,
        date: patch.date ?? existing.date,
        descriptionEn: patch.description?.en ?? existing.descriptionEn,
        descriptionTh: patch.description?.th ?? existing.descriptionTh,
        image: patch.image ?? existing.image,
        published: patch.published ?? existing.published,
      },
    });
    revalidateEvents();
    return NextResponse.json(hotelEventToClient(updated));
  } catch (e) {
    console.error("[api/events PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    await prisma.hotelEvent.delete({ where: { id: params.id } });
    revalidateEvents();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/events DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
