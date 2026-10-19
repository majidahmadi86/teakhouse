import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { roomToClient, roomToDb } from "@/lib/mappers";
import type { Room } from "@/lib/rooms";
import { revalidateRooms } from "@/lib/revalidate";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";
import { validateRoomPatch } from "@/lib/roomValidation";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const row = await prisma.room.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(roomToClient(row));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const patch = (await req.json()) as Partial<Room>;
    const invalid = validateRoomPatch(patch);
    if (invalid) return NextResponse.json(invalid, { status: 400 });
    if (patch.slug !== undefined) {
      const taken = await prisma.room.findFirst({
        where: { slug: patch.slug, id: { not: params.id } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json(
          { error: "slug-taken", message: "Another room already uses this address." },
          { status: 409 }
        );
      }
    }
    const existing = await prisma.room.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const current = roomToClient(existing);
    const merged: Room = {
      ...current,
      ...patch,
      name: patch.name ? { ...current.name, ...patch.name } : current.name,
      meta: patch.meta ? { ...current.meta, ...patch.meta } : current.meta,
      description: patch.description
        ? { ...current.description, ...patch.description }
        : current.description,
      bedType: patch.bedType
        ? { ...current.bedType, ...patch.bedType }
        : current.bedType,
      view: patch.view ? { ...current.view, ...patch.view } : current.view,
      floor: patch.floor ? { ...current.floor, ...patch.floor } : current.floor,
      urgency: patch.urgency
        ? { en: patch.urgency.en ?? "", th: patch.urgency.th ?? "" }
        : current.urgency,
    };
    const updated = await prisma.room.update({
      where: { id: params.id },
      data: roomToDb(merged),
    });
    revalidateRooms();
    return NextResponse.json(roomToClient(updated));
  } catch (e) {
    console.error("[api/rooms PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const room = await prisma.room.findUnique({ where: { id: params.id } });
    if (!room) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // v18 · A room with booking history is never deleted: that would take the
    // guests' bookings with it. The owner is told how many there are and can
    // archive the room instead (active = false), which hides it from guests.
    const bookingCount = await prisma.booking.count({
      where: { roomSlug: room.slug },
    });
    if (bookingCount > 0) {
      return NextResponse.json(
        {
          error: "has-bookings",
          count: bookingCount,
          message: `This room has ${bookingCount} booking(s). Archive it instead.`,
        },
        { status: 409 }
      );
    }
    await prisma.roomBlock.deleteMany({ where: { roomId: params.id } });
    await prisma.seasonalPriceRule.deleteMany({ where: { roomId: params.id } });
    await prisma.room.delete({ where: { id: params.id } });
    revalidateRooms();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/rooms DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
