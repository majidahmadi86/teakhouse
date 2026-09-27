import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { CHANNEL_KINDS, channelToClient, isChannelKind, storeSecret } from "@/lib/channels/registry";
import { getHotelId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = await gate(req, "channels:read");
  if (isDenied(g)) return g.denied;
  const rows = await prisma.channel.findMany({
    where: { hotelId: getHotelId() },
    include: { roomMaps: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ channels: rows.map(channelToClient), kinds: CHANNEL_KINDS });
}

type Body = {
  kind?: string;
  name?: string;
  endpoint?: string;
  secret?: string;
  commissionPct?: number;
  mode?: string;
  enabled?: boolean;
  roomMaps?: { roomId: string; externalRoomId: string; externalRateId?: string }[];
};

export async function POST(req: Request) {
  const g = await gate(req, "channels:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  if (!isChannelKind(body.kind)) return bad("kind is required");
  const preset = CHANNEL_KINDS.find((k) => k.kind === body.kind)!;
  const created = await prisma.channel.create({
    data: {
      hotelId: getHotelId(),
      kind: body.kind,
      name: (body.name ?? preset.label).trim().slice(0, 60),
      endpoint: (body.endpoint ?? "").trim().slice(0, 500),
      secretEnc: storeSecret((body.secret ?? "").trim()),
      commissionPct: typeof body.commissionPct === "number" ? body.commissionPct : preset.commission,
      mode: ["both", "push", "pull", "off"].includes(body.mode ?? "") ? body.mode! : "both",
      enabled: body.enabled ?? false,
      roomMaps: body.roomMaps?.length
        ? {
            create: body.roomMaps.map((m) => ({
              roomId: m.roomId,
              externalRoomId: m.externalRoomId,
              externalRateId: m.externalRateId ?? "",
            })),
          }
        : undefined,
    },
    include: { roomMaps: true },
  });
  await audit(g.actor, "channel.created", "channel", created.id, { kind: created.kind });
  return NextResponse.json(channelToClient(created), { status: 201 });
}
