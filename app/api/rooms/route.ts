import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied, readJson } from "@/lib/api";
import { roomToClient, roomToDb } from "@/lib/mappers";
import type { Room } from "@/lib/rooms";
import { revalidateRooms } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.room.findMany({ orderBy: { rate: "desc" } });
  return NextResponse.json(rows.map(roomToClient));
}

export async function POST(req: Request) {
  const g = await gate(req, "rooms:write");
  if (isDenied(g)) return g.denied;
  try {
    const body = await readJson<Room & { units?: number }>(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    const created = await prisma.room.create({
      data: {
        ...roomToDb(body),
        hotelId: "default",
        units: typeof body.units === "number" && body.units > 0 ? Math.round(body.units) : 1,
      },
    });
    revalidateRooms();
    await audit(g.actor, "room.created", "room", created.id);
    return NextResponse.json(roomToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/rooms POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
