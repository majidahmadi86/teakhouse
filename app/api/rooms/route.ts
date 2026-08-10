import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { roomToClient, roomToDb } from "@/lib/mappers";
import type { Room } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.room.findMany({ orderBy: { rate: "desc" } });
  return NextResponse.json(rows.map(roomToClient));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Room;
    const created = await prisma.room.create({
      data: { ...roomToDb(body), hotelId: "default" },
    });
    return NextResponse.json(roomToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/rooms POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
