import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { roomToClient } from "@/lib/mappers";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const HK_STATUSES = ["clean", "dirty", "inspected", "ooo"] as const;
type HkStatus = (typeof HK_STATUSES)[number];

/** v15 · Housekeeping board · every role may move a room's status. */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await gate(req, "housekeeping:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<{ status?: string }>(req)) ?? {};
  if (!HK_STATUSES.includes(body.status as HkStatus)) return bad("status must be clean | dirty | inspected | ooo");
  const room = await prisma.room.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] } });
  if (!room) return bad("Not found", 404);
  const updated = await prisma.room.update({
    where: { id: room.id },
    data: { hkStatus: body.status, hkUpdatedAt: new Date() },
  });
  await audit(g.actor, "housekeeping.updated", "room", room.id, { status: body.status });
  return NextResponse.json({ ...roomToClient(updated), hkStatus: updated.hkStatus, units: updated.units });
}
