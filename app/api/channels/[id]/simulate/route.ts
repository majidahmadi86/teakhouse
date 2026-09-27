import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { processInbound } from "@/lib/channels/inbound";
import { channelSecret } from "@/lib/channels/registry";
import { sign } from "@/lib/channels/signing";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
type Body = {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  guest?: string;
  amount?: number;
  externalId?: string;
  type?: "reservation.created" | "reservation.cancelled";
};

/**
 * v15 · "Send a test reservation from this channel" · builds a correctly
 * signed event and runs it through the real inbound path, so the sandbox can
 * demonstrate the double-booking guard end to end.
 */
export async function POST(req: Request, { params }: Ctx) {
  const g = await gate(req, "channels:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  const channel = await prisma.channel.findUnique({ where: { id: params.id }, include: { roomMaps: true } });
  if (!channel) return bad("Not found", 404);
  const map = channel.roomMaps.find((m) => m.roomId === body.roomId) ?? channel.roomMaps[0];
  if (!map) return bad("map at least one room to this channel first", 422);

  const event = {
    type: body.type ?? "reservation.created",
    externalId: body.externalId ?? `SIM-${Date.now()}`,
    externalRoomId: map.externalRoomId,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    guest: { name: body.guest ?? `${channel.name} test guest` },
    adults: 2,
    amount: body.amount,
    notes: "Simulated from the channel manager page",
  };
  const raw = JSON.stringify(event);
  const secret = channelSecret(channel);
  const headers = secret
    ? sign(secret, raw)
    : { signature: null as string | null, timestamp: null as string | null };
  const result = await processInbound(
    channel.id,
    raw,
    { signature: headers.signature, timestamp: headers.timestamp },
    { skipSignature: !secret }
  );
  await audit(g.actor, "channel.simulated", "channel", channel.id, { status: result.status });
  return NextResponse.json({ sent: event, response: result.body }, { status: result.status });
}
