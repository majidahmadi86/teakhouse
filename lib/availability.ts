/**
 * Live availability + pricing for a date range · server only.
 *
 * v15 · a thin view over lib/inventory. The concierge, the quote API and the
 * booking service read the SAME snapshot and price with the SAME engine
 * (calendar rules, then yield), so the concierge can never quote a room the
 * booking page would refuse, or a price the receipt would contradict.
 */

import {
  loadSnapshot,
  priceStay,
  unitsLeft,
  type InventoryRoom,
  type Snapshot,
} from "@/lib/inventory";
import { addDaysIso, nightsBetweenIso, type NightRate, type RateLine } from "@/lib/pricing";
import { hotelTodayIso } from "@/lib/utils";

export type RoomAvailability = {
  roomId: string;
  slug: string;
  nameEn: string;
  nameTh: string;
  capacity: number;
  available: boolean;
  /** Why it is not available · "booked" | "blocked" | null */
  reason: "booked" | "blocked" | null;
  unitsLeft: number;
  nights: NightRate[];
  lines: RateLine[];
  total: number;
  minNight: number;
  maxNight: number;
  mixed: boolean;
  otaTotal: number;
  minStay: { minNights: number; label: string } | null;
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

function evaluate(snapshot: Snapshot, checkIn: string, checkOut: string, todayIso: string): RoomAvailability[] {
  return snapshot.rooms.map((room: InventoryRoom) => {
    const left = unitsLeft(snapshot, room, checkIn, checkOut);
    const blocked = left === 0 && nightsBlocked(snapshot, room, checkIn, checkOut);
    const price = priceStay(snapshot, room, checkIn, checkOut, todayIso);
    const available = left > 0 && !price.minStay;
    return {
      roomId: room.id,
      slug: room.slug,
      nameEn: room.nameEn,
      nameTh: room.nameTh,
      capacity: room.capacity,
      available,
      reason: left > 0 ? null : blocked ? "blocked" : "booked",
      unitsLeft: left,
      nights: price.nights,
      lines: price.lines,
      total: price.total,
      minNight: price.minNight,
      maxNight: price.maxNight,
      mixed: price.mixed,
      otaTotal: price.otaTotal,
      minStay: price.minStay,
    };
  });
}

function nightsBlocked(snapshot: Snapshot, room: InventoryRoom, checkIn: string, checkOut: string): boolean {
  let d = checkIn;
  while (d < checkOut) {
    if (snapshot.blocked.has(`${room.slug}:${d}`)) return true;
    d = addDaysIso(d, 1);
  }
  return false;
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
  const todayIso = hotelTodayIso();

  const rooms = evaluate(snapshot, checkIn, checkOut, todayIso);
  const free = rooms.filter((r) => r.available);

  const alternatives: AlternativeStay[] = [];
  if (free.length === 0) {
    for (const shift of ALTERNATIVE_SHIFTS) {
      if (alternatives.length >= 2) break;
      const altIn = addDaysIso(checkIn, shift);
      const altOut = addDaysIso(checkOut, shift);
      if (altIn < todayIso) continue;
      const altFree = evaluate(snapshot, altIn, altOut, todayIso).filter((r) => r.available);
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
