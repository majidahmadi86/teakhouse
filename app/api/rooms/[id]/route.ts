import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied } from "@/lib/api";
import { roomToClient, roomToDb } from "@/lib/mappers";
import type { Room } from "@/lib/rooms";
import { revalidateRooms } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const row = await prisma.room.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...roomToClient(row), units: row.units, hkStatus: row.hkStatus });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await gate(req, "rooms:write");
  if (isDenied(g)) return g.denied;
  try {
    const patch = (await req.json()) as Partial<Room> & { units?: number };
    const existing = await prisma.room.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const current = roomToClient(existing);
    const { units, ...rest } = patch;
    const merged: Room = {
      ...current,
      ...rest,
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
      data: {
        ...roomToDb(merged),
        ...(typeof units === "number" && units > 0 ? { units: Math.round(units) } : {}),
      },
    });
    revalidateRooms();
    await audit(g.actor, "room.updated", "room", params.id, { keys: Object.keys(patch) });
    return NextResponse.json({ ...roomToClient(updated), units: updated.units, hkStatus: updated.hkStatus });
  } catch (e) {
    console.error("[api/rooms PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await gate(req, "rooms:write");
  if (isDenied(g)) return g.denied;
  try {
    const room = await prisma.room.findUnique({ where: { id: params.id } });
    if (!room) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const bookings = await prisma.booking.findMany({
      where: { roomSlug: room.slug },
      select: { id: true },
    });
    const ids = bookings.map((b) => b.id);
    if (ids.length) {
      await prisma.guestBooking.deleteMany({ where: { bookingId: { in: ids } } });
      await prisma.serviceRequest.updateMany({ where: { bookingId: { in: ids } }, data: { bookingId: null } });
      await prisma.booking.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.roomBlock.deleteMany({ where: { roomId: params.id } });
    await prisma.seasonalPriceRule.deleteMany({ where: { roomId: params.id } });
    await prisma.channelRoomMap.deleteMany({ where: { roomId: params.id } });
    await prisma.room.delete({ where: { id: params.id } });
    revalidateRooms();
    await audit(g.actor, "room.deleted", "room", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/rooms DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
