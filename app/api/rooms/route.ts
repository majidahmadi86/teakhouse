import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { roomToClient, roomToDb } from "@/lib/mappers";
import type { Room } from "@/lib/rooms";
import { revalidateRooms } from "@/lib/revalidate";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";
import { validateRoomCreate } from "@/lib/roomValidation";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.room.findMany({ orderBy: { rate: "desc" } });
  return NextResponse.json(rows.map(roomToClient));
}

export async function POST(req: Request) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as Room;
    const invalid = validateRoomCreate(body);
    if (invalid) return NextResponse.json(invalid, { status: 400 });
    const taken = await prisma.room.findFirst({
      where: { OR: [{ slug: body.slug }, { id: body.id || body.slug }] },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "slug-taken", field: "slug", message: "Another room already uses this address." },
        { status: 409 }
      );
    }
    const created = await prisma.room.create({
      data: { ...roomToDb(body), hotelId: "default" },
    });
    revalidateRooms();
    return NextResponse.json(roomToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/rooms POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
