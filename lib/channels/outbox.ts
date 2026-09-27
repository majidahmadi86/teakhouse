import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit, SYSTEM } from "@/lib/audit";
import { addDaysIso, nightlyRate } from "@/lib/pricing";
import { loadSnapshot, unitsLeft } from "@/lib/inventory";
import { getHotelId } from "@/lib/tenant";
import { channelSecret, type ChannelRow } from "@/lib/channels/registry";
import { sign, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/channels/signing";

/**
 * v15 · Transactional outbox.
 *
 * An inventory or rate change is written to OutboxEvent INSIDE the transaction
 * that made the change, so the two cannot disagree: either both committed or
 * neither did. The dispatcher then turns each pending event into one signed
 * ARI (availability · rates · inventory) push per enabled channel. A push that
 * fails stays pending with its error and is retried on the next dispatch,
 * which runs after every booking write and on the cron.
 */

export type OutboxType = "availability.changed" | "rate.changed" | "room.changed";

type Tx = Pick<Prisma.TransactionClient, "outboxEvent">;

export async function enqueueOutbox(
  tx: Tx,
  type: OutboxType,
  key: string,
  payload: Record<string, unknown>
): Promise<void> {
  await tx.outboxEvent.upsert({
    where: { key },
    create: { hotelId: getHotelId(), type, key, payload: JSON.stringify(payload) },
    update: {},
  });
}

/** Enqueue outside a transaction · for rate rule and room edits. */
export async function enqueueOutboxNow(
  type: OutboxType,
  key: string,
  payload: Record<string, unknown>
): Promise<void> {
  await enqueueOutbox(prisma, type, key, payload);
}

export type AriRoom = {
  roomId: string;
  externalRoomId: string;
  externalRateId: string;
  dates: { date: string; available: number; rate: number; currency: "THB" }[];
};

export type AriPush = {
  event: OutboxType;
  key: string;
  hotelId: string;
  sentAt: string;
  reason: string;
  rooms: AriRoom[];
};

/**
 * Build the ARI body for one event and one channel · only the rooms that
 * channel has mapped, with CURRENT availability and calendar rate for every
 * date the event touched (a cancellation and a booking both push the truth
 * as it stands now, so ordering between events does not matter).
 */
async function buildPush(
  channel: ChannelRow,
  event: { type: string; key: string; payload: string }
): Promise<AriPush> {
  const payload = JSON.parse(event.payload) as {
    dates?: string[];
    roomId?: string;
    roomSlug?: string;
    reason?: string;
  };
  const dates = (payload.dates ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const maps = channel.roomMaps;
  if (dates.length === 0 || maps.length === 0) {
    return {
      event: event.type as OutboxType,
      key: event.key,
      hotelId: channel.hotelId,
      sentAt: new Date().toISOString(),
      reason: payload.reason ?? "",
      rooms: [],
    };
  }
  const snap = await loadSnapshot(dates[0], addDaysIso(dates[dates.length - 1], 1));
  const rooms: AriRoom[] = [];
  for (const map of maps) {
    const room = snap.rooms.find((r) => r.id === map.roomId);
    if (!room) continue;
    if (payload.roomId && payload.roomId !== room.id && payload.roomSlug !== room.slug) continue;
    rooms.push({
      roomId: room.id,
      externalRoomId: map.externalRoomId,
      externalRateId: map.externalRateId,
      dates: dates.map((date) => ({
        date,
        available: unitsLeft(snap, room, date, addDaysIso(date, 1)),
        rate: nightlyRate(room.rate, date, snap.rulesByRoom[room.id] ?? []).price,
        currency: "THB",
      })),
    });
  }
  return {
    event: event.type as OutboxType,
    key: event.key,
    hotelId: channel.hotelId,
    sentAt: new Date().toISOString(),
    reason: payload.reason ?? "",
    rooms,
  };
}

async function deliver(channel: ChannelRow, push: AriPush): Promise<void> {
  const body = JSON.stringify(push);
  if (channel.kind === "loopback" || !channel.endpoint) {
    // The demo channel · delivery is recorded, nothing leaves the building.
    await audit(SYSTEM, "channel.push", "channel", channel.id, {
      key: push.key,
      rooms: push.rooms.length,
      dates: push.rooms[0]?.dates.length ?? 0,
    });
    return;
  }
  const secret = channelSecret(channel);
  const { timestamp, signature } = sign(secret, body);
  const res = await fetch(channel.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [TIMESTAMP_HEADER]: timestamp,
      [SIGNATURE_HEADER]: signature,
      "x-tkh-channel": channel.kind,
      "idempotency-key": push.key,
    },
    body,
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`${channel.name} answered ${res.status}`);
}

/**
 * Push every pending event to every enabled channel. Bounded by a time budget
 * because it runs at the end of a booking request; whatever is left is picked
 * up by the next run. Returns what happened so the channels page can show it.
 */
export async function dispatchOutbox(
  opts: { budgetMs?: number; limit?: number } = {}
): Promise<{ sent: number; failed: number; skipped: number }> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 8000;
  const channels = await prisma.channel.findMany({
    where: { enabled: true, mode: { in: ["both", "push"] } },
    include: { roomMaps: true },
  });
  const pending = await prisma.outboxEvent.findMany({
    where: { status: "pending", attempts: { lt: 8 } },
    orderBy: { createdAt: "asc" },
    take: opts.limit ?? 25,
  });
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const event of pending) {
    if (Date.now() - started > budget) {
      skipped++;
      continue;
    }
    if (channels.length === 0) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "sent", sentAt: new Date(), lastError: "no channels enabled" },
      });
      sent++;
      continue;
    }
    const errors: string[] = [];
    for (const channel of channels) {
      try {
        const push = await buildPush(channel, event);
        await deliver(channel, push);
        await prisma.channel.update({
          where: { id: channel.id },
          data: { lastSyncAt: new Date(), lastError: "" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${channel.name}: ${msg}`);
        await prisma.channel
          .update({ where: { id: channel.id }, data: { lastError: msg.slice(0, 300) } })
          .catch(() => undefined);
      }
    }
    if (errors.length === 0) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "sent", sentAt: new Date(), lastError: "", attempts: { increment: 1 } },
      });
      sent++;
    } else {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: event.attempts + 1 >= 8 ? "failed" : "pending",
          lastError: errors.join(" · ").slice(0, 500),
          attempts: { increment: 1 },
        },
      });
      failed++;
    }
  }
  return { sent, failed, skipped };
}
