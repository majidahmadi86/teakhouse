import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gate, isDenied } from "@/lib/api";
import { getHotelId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** v15 · The last 100 audit lines · ?entity=booking&entityId=… narrows it. */
export async function GET(req: Request) {
  const g = await gate(req, "audit:read");
  if (isDenied(g)) return g.denied;
  const u = new URL(req.url);
  const entity = u.searchParams.get("entity") ?? undefined;
  const entityId = u.searchParams.get("entityId") ?? undefined;
  const rows = await prisma.auditLog.findMany({
    where: { hotelId: getHotelId(), ...(entity ? { entity } : {}), ...(entityId ? { entityId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorRole: r.actorRole,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      meta: JSON.parse(r.meta) as unknown,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}
