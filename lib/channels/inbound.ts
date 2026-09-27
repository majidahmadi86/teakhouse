import { prisma } from "@/lib/db";
import { audit, SYSTEM } from "@/lib/audit";
import { cancelBooking, createBooking } from "@/lib/booking/createBooking";
import { loadSnapshot, unitsLeft } from "@/lib/inventory";
import { addDaysIso } from "@/lib/pricing";
import { channelSecret } from "@/lib/channels/registry";
import { verify } from "@/lib/channels/signing";

/**
 * v15 · Inbound channel events · reservations arriving from an OTA.
 *
 * Contract (docs/channel-manager.md):
 *   { "type": "reservation.created" | "reservation.cancelled" | "reservation.modified",
 *     "externalId": "<the channel's reservation id>",
 *     "externalRoomId": "<their room type id>",
 *     "checkIn": "yyyy-mm-dd", "checkOut": "yyyy-mm-dd",
 *     "guest": { "name", "email"?, "phone"? }, "adults"?, "children"?,
 *     "amount": <what the guest paid the channel, in THB>, "notes"? }
 *
 * Rules that stop double bookings:
 *   · the signature is verified against the channel's secret before anything is read
 *   · (channel, externalId) is unique · a redelivered webhook is a no-op "duplicate"
 *   · creation goes through createBooking(), i.e. the same locked path as a
 *     direct booking · the LAST unit cannot be sold twice, whoever asks second
 *     gets 409 with the nearest alternatives so the channel can offer them
 */

export type InboundReservation = {
  type: "reservation.created" | "reservation.cancelled" | "reservation.modified";
  externalId: string;
  externalRoomId?: string;
  checkIn?: string;
  checkOut?: string;
  guest?: { name?: string; email?: string; phone?: string };
  adults?: number;
  children?: number;
  amount?: number;
  notes?: string;
};

export type InboundResult = {
  status: number;
  body: Record<string, unknown>;
};

function parse(raw: string): InboundReservation | null {
  try {
    const obj = JSON.parse(raw) as InboundReservation;
    if (!obj || typeof obj !== "object") return null;
    if (
      obj.type !== "reservation.created" &&
      obj.type !== "reservation.cancelled" &&
      obj.type !== "reservation.modified"
    ) {
      return null;
    }
    if (typeof obj.externalId !== "string" || !obj.externalId) return null;
    return obj;
  } catch {
    return null;
  }
}

async function alternatives(roomId: string, checkIn: string, checkOut: string) {
  const snap = await loadSnapshot(addDaysIso(checkIn, -7), addDaysIso(checkOut, 7));
  const room = snap.rooms.find((r) => r.id === roomId);
  if (!room) return [];
  const out: { checkIn: string; checkOut: string }[] = [];
  for (const shift of [1, -1, 2, -2, 3, -3, 7, -7]) {
    const a = addDaysIso(checkIn, shift);
    const b = addDaysIso(checkOut, shift);
    if (unitsLeft(snap, room, a, b) > 0) out.push({ checkIn: a, checkOut: b });
    if (out.length >= 2) break;
  }
  return out;
}

export async function processInbound(
  channelId: string,
  rawBody: string,
  headers: { signature: string | null; timestamp: string | null },
  opts: { skipSignature?: boolean } = {}
): Promise<InboundResult> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { roomMaps: true },
  });
  if (!channel || !channel.enabled || channel.mode === "off" || channel.mode === "push") {
    return { status: 404, body: { error: "channel not accepting reservations" } };
  }

  if (!opts.skipSignature) {
    const secret = channelSecret(channel);
    if (!secret) return { status: 401, body: { error: "channel has no secret configured" } };
    const v = verify(secret, rawBody, headers.signature, headers.timestamp);
    if (!v.ok) {
      await audit(SYSTEM, "channel.inbound.rejected", "channel", channel.id, { reason: v.reason });
      return { status: 401, body: { error: v.reason } };
    }
  }

  const event = parse(rawBody);
  if (!event) return { status: 400, body: { error: "malformed event" } };

  // Idempotency · the unique index is the source of truth, the create is the claim.
  let inboundId: string;
  try {
    const row = await prisma.inboundEvent.create({
      data: {
        channelId: channel.id,
        externalId: event.externalId,
        type: event.type,
        payload: rawBody.slice(0, 20000),
        status: "processed",
      },
    });
    inboundId = row.id;
  } catch {
    return { status: 200, body: { accepted: true, duplicate: true, externalId: event.externalId } };
  }

  const finish = async (status: string, error = "") => {
    await prisma.inboundEvent.update({ where: { id: inboundId }, data: { status, error } });
  };

  if (event.type === "reservation.cancelled") {
    const booking = await prisma.booking.findFirst({
      where: { channelId: channel.id, externalRef: event.externalId },
    });
    if (!booking) {
      await finish("rejected", "unknown reservation");
      return { status: 404, body: { error: "unknown reservation" } };
    }
    await cancelBooking(booking.id, SYSTEM, `channel ${channel.name}`);
    return { status: 200, body: { accepted: true, bookingCode: booking.code, status: "cancelled" } };
  }

  const map = channel.roomMaps.find((m) => m.externalRoomId === event.externalRoomId);
  if (!map) {
    await finish("rejected", "unmapped room");
    return { status: 422, body: { error: "unmapped externalRoomId", externalRoomId: event.externalRoomId } };
  }
  const room = await prisma.room.findUnique({ where: { id: map.roomId } });
  if (!room || !event.checkIn || !event.checkOut) {
    await finish("rejected", "room or dates missing");
    return { status: 422, body: { error: "room or dates missing" } };
  }

  if (event.type === "reservation.modified") {
    const existing = await prisma.booking.findFirst({
      where: { channelId: channel.id, externalRef: event.externalId },
    });
    if (existing) await cancelBooking(existing.id, SYSTEM, "modified by channel");
  }

  const result = await createBooking(
    {
      guest: event.guest?.name ?? `${channel.name} guest`,
      email: event.guest?.email ?? "",
      phone: event.guest?.phone ?? "",
      roomSlug: room.slug,
      checkIn: event.checkIn,
      checkOut: event.checkOut,
      adults: event.adults ?? null,
      children: event.children ?? null,
      notes: event.notes ?? "",
      source: channel.name,
      channelId: channel.id,
      externalRef: event.externalId,
      trustedAmount: typeof event.amount === "number" ? event.amount : null,
    },
    SYSTEM
  );

  if (!result.ok) {
    if (result.error === "overbooked") {
      await finish("overbooked", "no unit left for these dates");
      return {
        status: 409,
        body: {
          accepted: false,
          reason: "overbooked",
          externalId: event.externalId,
          alternatives: await alternatives(room.id, event.checkIn, event.checkOut),
        },
      };
    }
    await finish("rejected", result.error);
    return { status: 422, body: { accepted: false, reason: result.error } };
  }

  return {
    status: 201,
    body: {
      accepted: true,
      externalId: event.externalId,
      bookingCode: result.booking.code,
      bookingId: result.booking.id,
    },
  };
}
