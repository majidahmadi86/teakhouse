import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied } from "@/lib/api";
import { dispatchOutbox, enqueueOutboxNow } from "@/lib/channels/outbox";
import { blocksToRecord } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = await gate(req, "bookings:read");
  if (isDenied(g)) return g.denied;
  const rows = await prisma.roomBlock.findMany({
    include: { room: { select: { slug: true } } },
  });
  return NextResponse.json(blocksToRecord(rows));
}

/** Toggle block for roomSlug + dateIso · a block is inventory, so channels hear about it. */
export async function POST(req: Request) {
  const g = await gate(req, "bookings:write");
  if (isDenied(g)) return g.denied;
  try {
    const body = (await req.json()) as { roomSlug: string; dateIso: string };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateIso ?? "")) {
      return NextResponse.json({ error: "dateIso must be yyyy-mm-dd" }, { status: 400 });
    }
    const room = await prisma.room.findUnique({ where: { slug: body.roomSlug } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const existing = await prisma.roomBlock.findUnique({
      where: { roomId_dateIso: { roomId: room.id, dateIso: body.dateIso } },
    });
    let blocked: boolean;
    if (existing) {
      await prisma.roomBlock.delete({ where: { id: existing.id } });
      blocked = false;
    } else {
      await prisma.roomBlock.create({ data: { roomId: room.id, dateIso: body.dateIso } });
      blocked = true;
    }
    await enqueueOutboxNow("availability.changed", `block:${room.id}:${body.dateIso}:${Date.now()}`, {
      roomId: room.id,
      roomSlug: room.slug,
      dates: [body.dateIso],
      reason: blocked ? "block.added" : "block.removed",
    });
    await audit(g.actor, blocked ? "block.added" : "block.removed", "room", room.id, { date: body.dateIso });
    await dispatchOutbox({ budgetMs: 1500 }).catch(() => undefined);
    return NextResponse.json({ blocked });
  } catch (e) {
    console.error("[api/blocks POST]", e);
    return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
  }
}
