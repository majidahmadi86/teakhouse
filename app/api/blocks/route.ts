import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { blocksToRecord } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.roomBlock.findMany({
    include: { room: { select: { slug: true } } },
  });
  return NextResponse.json(blocksToRecord(rows));
}

/** Toggle block for roomSlug + dateIso */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { roomSlug: string; dateIso: string };
    const room = await prisma.room.findUnique({
      where: { slug: body.roomSlug },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const existing = await prisma.roomBlock.findUnique({
      where: {
        roomId_dateIso: { roomId: room.id, dateIso: body.dateIso },
      },
    });
    if (existing) {
      await prisma.roomBlock.delete({ where: { id: existing.id } });
      return NextResponse.json({ blocked: false });
    }
    await prisma.roomBlock.create({
      data: { roomId: room.id, dateIso: body.dateIso },
    });
    return NextResponse.json({ blocked: true });
  } catch (e) {
    console.error("[api/blocks POST]", e);
    return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
  }
}
