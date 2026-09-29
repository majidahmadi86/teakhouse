/**
 * Live availability + per-day pricing for a date range · server only.
 *
 * This is the concierge's single source of truth about what is free and what
 * it costs. It reads the same tables the booking engine writes to and prices
 * with the same engine, so the concierge can never quote a room the booking
 * page would refuse, or a price the receipt would contradict.
 */

import { prisma } from "./db";
import {
  addDaysIso,
  eachNightIso,
  groupNights,
  nightsBetweenIso,
  otaEquivalent,
  quoteStay,
  toPriceRule,
  type NightRate,
  type RateLine,
} from "./pricing";

export type RoomAvailability = {
  roomId: string;
  slug: string;
  nameEn: string;
  nameTh: string;
  capacity: number;
  available: boolean;
  /** Why it is not available · "booked" | "blocked" | null */
  reason: "booked" | "blocked" | null;
  nights: NightRate[];
  lines: RateLine[];
  total: number;
  minNight: number;
  maxNight: number;
  mixed: boolean;
  otaTotal: number;
};

export type AlternativeStay = {
  checkIn: string;
  checkOut: string;
  /** How many room types are free for this window. */
  freeRooms: number;
  cheapestTotal: number;
};

export type AvailabilityResult = {
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: RoomAvailability[];
  free: RoomAvailability[];
  anyAvailable: boolean;
  alternatives: AlternativeStay[];
};

/** Half-open overlap: a booking blocks a range if it touches any of its nights. */
function overlaps(
  bookingIn: string,
  bookingOut: string,
  rangeIn: string,
  rangeOut: string
): boolean {
  return bookingIn < rangeOut && bookingOut > rangeIn;
}

type Snapshot = {
  rooms: {
    id: string;
    slug: string;
    nameEn: string;
    nameTh: string;
    capacity: number;
    rate: number;
    ota: number;
  }[];
  bookings: { roomSlug: string; checkIn: string; checkOut: string }[];
  blocked: Set<string>;
  rulesByRoom: Record<string, ReturnType<typeof toPriceRule>[]>;
};

/**
 * One DB round trip for the whole question, including the alternative windows.
 * The lookahead is bounded so a concierge reply can never fan out into a scan.
 */
async function loadSnapshot(
  windowStart: string,
  windowEnd: string
): Promise<Snapshot> {
  const [rooms, bookings, blocks, rules] = await Promise.all([
    prisma.room.findMany({
      where: { active: true },
      orderBy: { rate: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameTh: true,
        capacity: true,
        rate: true,
        ota: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        status: { not: "cancelled" },
        checkIn: { lt: windowEnd },
        checkOut: { gt: windowStart },
      },
      select: { roomSlug: true, checkIn: true, checkOut: true },
    }),
    prisma.roomBlock.findMany({
      where: { dateIso: { gte: windowStart, lt: windowEnd } },
      select: { dateIso: true, room: { select: { slug: true } } },
    }),
    prisma.seasonalPriceRule.findMany(),
  ]);

  const rulesByRoom: Snapshot["rulesByRoom"] = {};
  for (const row of rules) {
    (rulesByRoom[row.roomId] ??= []).push(toPriceRule(row));
  }

  return {
    rooms,
    bookings,
    blocked: new Set(blocks.map((b) => `${b.room.slug}:${b.dateIso}`)),
    rulesByRoom,
  };
}

function evaluate(
  snapshot: Snapshot,
  checkIn: string,
  checkOut: string
): RoomAvailability[] {
  const stayNights = eachNightIso(checkIn, checkOut);

  return snapshot.rooms.map((room) => {
    const booked = snapshot.bookings.some(
      (b) =>
        b.roomSlug === room.slug &&
        overlaps(b.checkIn, b.checkOut, checkIn, checkOut)
    );
    const blocked = stayNights.some((n) =>
      snapshot.blocked.has(`${room.slug}:${n}`)
    );

    const quote = quoteStay(
      room.rate,
      checkIn,
      checkOut,
      snapshot.rulesByRoom[room.id] ?? []
    );

    return {
      roomId: room.id,
      slug: room.slug,
      nameEn: room.nameEn,
      nameTh: room.nameTh,
      capacity: room.capacity,
      available: !booked && !blocked,
      reason: booked ? "booked" : blocked ? "blocked" : null,
      nights: quote.nights,
      lines: groupNights(quote.nights),
      total: quote.total,
      minNight: quote.minNight,
      maxNight: quote.maxNight,
      mixed: quote.mixed,
      otaTotal: otaEquivalent(quote.total, room.rate, room.ota),
    };
  });
}

/** How far either side of the asked dates we look for a nearest alternative. */
const ALTERNATIVE_SHIFTS = [1, -1, 2, -2, 3, -3, 7, -7];

export async function checkAvailability(
  checkIn: string,
  checkOut: string
): Promise<AvailabilityResult> {
  const nights = nightsBetweenIso(checkIn, checkOut);
  if (nights <= 0) {
    throw new Error("checkOut must be after checkIn");
  }

  // Widen the snapshot enough to answer the alternatives from the same read.
  const windowStart = addDaysIso(checkIn, -8);
  const windowEnd = addDaysIso(checkOut, 8);
  const snapshot = await loadSnapshot(windowStart, windowEnd);

  const rooms = evaluate(snapshot, checkIn, checkOut);
  const free = rooms.filter((r) => r.available);

  const alternatives: AlternativeStay[] = [];
  if (free.length === 0) {
    const todayIso = new Date().toISOString().slice(0, 10);
    for (const shift of ALTERNATIVE_SHIFTS) {
      if (alternatives.length >= 2) break;
      const altIn = addDaysIso(checkIn, shift);
      const altOut = addDaysIso(checkOut, shift);
      if (altIn < todayIso) continue;
      const altFree = evaluate(snapshot, altIn, altOut).filter(
        (r) => r.available
      );
      if (altFree.length === 0) continue;
      alternatives.push({
        checkIn: altIn,
        checkOut: altOut,
        freeRooms: altFree.length,
        cheapestTotal: Math.min(...altFree.map((r) => r.total)),
      });
    }
  }

  return {
    checkIn,
    checkOut,
    nights,
    rooms,
    free,
    anyAvailable: free.length > 0,
    alternatives,
  };
}
