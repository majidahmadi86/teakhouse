import type { Prisma } from "@prisma/client";
import { open, seal } from "@/lib/vault";

/**
 * v15 · Channel catalogue · what can be connected, and how secrets are kept.
 *
 * Every kind speaks the same signed ARI JSON contract (docs/channel-manager.md).
 * Certifying against a specific partner's native protocol (SiteMinder's
 * OTA_HotelAvailNotifRQ, Booking.com's Connectivity API…) is a translation of
 * that contract at the edge; the PMS side does not change.
 */

export type ChannelKind =
  | "booking.com"
  | "agoda"
  | "expedia"
  | "siteminder"
  | "exely"
  | "hoteliers.guru"
  | "custom"
  | "loopback";

export const CHANNEL_KINDS: { kind: ChannelKind; label: string; commission: number }[] = [
  { kind: "booking.com", label: "Booking.com", commission: 15 },
  { kind: "agoda", label: "Agoda", commission: 17 },
  { kind: "expedia", label: "Expedia", commission: 18 },
  { kind: "siteminder", label: "SiteMinder", commission: 0 },
  { kind: "exely", label: "Exely", commission: 0 },
  { kind: "hoteliers.guru", label: "Hoteliers.guru", commission: 0 },
  { kind: "custom", label: "Custom webhook", commission: 0 },
  { kind: "loopback", label: "Sandbox (loopback)", commission: 15 },
];

export function isChannelKind(v: unknown): v is ChannelKind {
  return CHANNEL_KINDS.some((k) => k.kind === v);
}

export type ChannelRow = Prisma.ChannelGetPayload<{ include: { roomMaps: true } }>;

/** Store a shared secret · sealed when the vault has a key, plain otherwise. */
export function storeSecret(plain: string): string {
  if (!plain) return "";
  return seal(plain) ?? plain;
}

export function channelSecret(channel: { secretEnc: string }): string {
  if (!channel.secretEnc) return "";
  if (channel.secretEnc.startsWith("v1.")) return open(channel.secretEnc) ?? "";
  return channel.secretEnc;
}

export function channelToClient(row: ChannelRow) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    enabled: row.enabled,
    commissionPct: row.commissionPct,
    endpoint: row.endpoint,
    hasSecret: Boolean(row.secretEnc),
    mode: row.mode,
    lastSyncAt: row.lastSyncAt ? row.lastSyncAt.toISOString() : null,
    lastError: row.lastError,
    roomMaps: row.roomMaps.map((m) => ({
      roomId: m.roomId,
      externalRoomId: m.externalRoomId,
      externalRateId: m.externalRateId,
    })),
  };
}

export type ChannelDto = ReturnType<typeof channelToClient>;
