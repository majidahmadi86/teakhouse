import { prisma } from "@/lib/db";
import {
  addDaysIso,
  eachNightIso,
  groupNights,
  nightsBetweenIso,
  otaEquivalent,
  quoteStay,
  toPriceRule,
  type PriceRule,
  type RateLine,
} from "@/lib/pricing";
import { applyYield, toYieldRule, type YieldNight, type YieldRule } from "@/lib/yield";

/**
 * v15 · Live inventory matrix · server only.
 *
 * One snapshot answers everything about a window of dates: what is free (in
 * UNITS, so a villa type with three units takes three stays a night), how full
 * the house is each night (which drives yield), and what any stay costs with
 * the calendar AND the demand layer applied. The concierge, the quote API, the
 * booking service, the channel push and the front desk all read this and
 * nothing else, so they can never disagree.
 */

export type InventoryRoom = {
  id: string;
  slug: string;
  nameEn: string;
  nameTh: string;
  capacity: number;
  rate: number;
  ota: number;
  units: number;
  active: boolean;
  hkStatus: string;
};

export type StayRef = { roomSlug: string; checkIn: string; checkOut: string };

export type Snapshot = {
  windowStart: string;
  windowEnd: string;
  rooms: InventoryRoom[];
  bookings: StayRef[];
  blocked: Set<string>;
  rulesByRoom: Record<string, PriceRule[]>;
  yieldRules: YieldRule[];
  totalUnits: number;
};

/** A subset of PrismaClient wide enough for a transaction client. */
export type Db = Pick<typeof prisma, "room" | "booking" | "roomBlock" | "seasonalPriceRule" | "yieldRule">;

function overlaps(a: StayRef, checkIn: string, checkOut: string): boolean {
  return a.checkIn < checkOut && a.checkOut > checkIn;
}

export async function loadSnapshot(
  windowStart: string,
  windowEnd: string,
  opts: { db?: Db; excludeBookingId?: string; includeInactive?: boolean } = {}
): Promise<Snapshot> {
  const db = opts.db ?? prisma;
  const [rooms, bookings, blocks, rules, yieldRows] = await Promise.all([
    db.room.findMany({
      where: opts.includeInactive ? {} : { active: true },
      orderBy: { rate: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameTh: true,
        capacity: true,
        rate: true,
        ota: true,
        units: true,
        active: true,
        hkStatus: true,
      },
    }),
    db.booking.findMany({
      where: {
        status: { not: "cancelled" },
        checkIn: { lt: windowEnd },
        checkOut: { gt: windowStart },
        ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
      select: { roomSlug: true, checkIn: true, checkOut: true },
    }),
    db.roomBlock.findMany({
      where: { dateIso: { gte: windowStart, lt: windowEnd } },
      select: { dateIso: true, room: { select: { slug: true } } },
    }),
    db.seasonalPriceRule.findMany(),
    db.yieldRule.findMany({ where: { enabled: true } }),
  ]);

  const rulesByRoom: Record<string, PriceRule[]> = {};
  for (const row of rules) (rulesByRoom[row.roomId] ??= []).push(toPriceRule(row));

  return {
    windowStart,
    windowEnd,
    rooms,
    bookings,
    blocked: new Set(blocks.map((b) => `${b.room.slug}:${b.dateIso}`)),
    rulesByRoom,
    yieldRules: yieldRows.map(toYieldRule),
    totalUnits: rooms.reduce((s, r) => s + Math.max(1, r.units), 0),
  };
}

/** Units of a room type still free for EVERY night of the range (min over nights). */
export function unitsLeft(
  snap: Snapshot,
  room: InventoryRoom,
  checkIn: string,
  checkOut: string
): number {
  const units = Math.max(1, room.units);
  let left = units;
  for (const night of eachNightIso(checkIn, checkOut)) {
    if (snap.blocked.has(`${room.slug}:${night}`)) return 0;
    const next = addDaysIso(night, 1);
    const sold = snap.bookings.filter(
      (b) => b.roomSlug === room.slug && overlaps(b, night, next)
    ).length;
    left = Math.min(left, units - sold);
    if (left <= 0) return 0;
  }
  return left;
}

/** Share of the whole house sold on one night · 0..1. */
export function occupancyFor(snap: Snapshot, dateIso: string): number {
  if (snap.totalUnits === 0) return 0;
  const next = addDaysIso(dateIso, 1);
  const sold = snap.bookings.filter((b) => overlaps(b, dateIso, next)).length;
  return Math.min(1, sold / snap.totalUnits);
}

export type StayPrice = {
  nights: YieldNight[];
  lines: RateLine[];
  total: number;
  /** calendar-only total · what the stay costs before demand pricing */
  calendarTotal: number;
  baseTotal: number;
  otaTotal: number;
  mixed: boolean;
  minNight: number;
  maxNight: number;
  minStay: { minNights: number; label: string } | null;
};

/**
 * The price of a stay: calendar rules, then yield. `bookedAtIso` is the day the
 * booking is being made (today at the hotel, normally) · it sets the lead time.
 */
export function priceStay(
  snap: Snapshot,
  room: InventoryRoom,
  checkIn: string,
  checkOut: string,
  bookedAtIso: string
): StayPrice {
  const calendar = quoteStay(room.rate, checkIn, checkOut, snap.rulesByRoom[room.id] ?? []);
  const nightsCount = nightsBetweenIso(checkIn, checkOut);
  const leadDays = nightsBetweenIso(bookedAtIso, checkIn);
  const yielded = applyYield(calendar.nights, {
    roomId: room.id,
    rules: snap.yieldRules,
    occupancyFor: (d) => occupancyFor(snap, d),
    leadDays: Math.max(0, leadDays),
    nightsCount,
  });
  const prices = yielded.nights.map((n) => n.price);
  const total = prices.reduce((s, p) => s + p, 0);
  return {
    nights: yielded.nights,
    lines: groupNights(yielded.nights),
    total,
    calendarTotal: calendar.total,
    baseTotal: calendar.baseTotal,
    otaTotal: otaEquivalent(total, room.rate, room.ota),
    mixed: prices.length > 0 && Math.min(...prices) !== Math.max(...prices),
    minNight: prices.length ? Math.min(...prices) : 0,
    maxNight: prices.length ? Math.max(...prices) : 0,
    minStay: yielded.minStay,
  };
}
