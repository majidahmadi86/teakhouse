import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied, readJson } from "@/lib/api";
import { channelToClient, storeSecret } from "@/lib/channels/registry";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
type Body = {
  name?: string;
  endpoint?: string;
  secret?: string;
  commissionPct?: number;
  mode?: string;
  enabled?: boolean;
  roomMaps?: { roomId: string; externalRoomId: string; externalRateId?: string }[];
};

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await gate(req, "channels:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  const existing = await prisma.channel.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    if (body.roomMaps) {
      await tx.channelRoomMap.deleteMany({ where: { channelId: params.id } });
      if (body.roomMaps.length) {
        await tx.channelRoomMap.createMany({
          data: body.roomMaps
            .filter((m) => m.roomId && m.externalRoomId)
            .map((m) => ({
              channelId: params.id,
              roomId: m.roomId,
              externalRoomId: m.externalRoomId.trim(),
              externalRateId: (m.externalRateId ?? "").trim(),
            })),
        });
      }
    }
    return tx.channel.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim().slice(0, 60) ?? existing.name,
        endpoint: body.endpoint !== undefined ? body.endpoint.trim().slice(0, 500) : existing.endpoint,
        secretEnc: body.secret !== undefined && body.secret !== "" ? storeSecret(body.secret.trim()) : existing.secretEnc,
        commissionPct: typeof body.commissionPct === "number" ? body.commissionPct : existing.commissionPct,
        mode: ["both", "push", "pull", "off"].includes(body.mode ?? "") ? body.mode! : existing.mode,
        enabled: typeof body.enabled === "boolean" ? body.enabled : existing.enabled,
      },
      include: { roomMaps: true },
    });
  });
  await audit(g.actor, "channel.updated", "channel", params.id, { keys: Object.keys(body) });
  return NextResponse.json(channelToClient(updated));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await gate(req, "channels:write");
  if (isDenied(g)) return g.denied;
  await prisma.booking.updateMany({ where: { channelId: params.id }, data: { channelId: null } });
  await prisma.channel.delete({ where: { id: params.id } }).catch(() => undefined);
  await audit(g.actor, "channel.deleted", "channel", params.id);
  return NextResponse.json({ ok: true });
}
