import { prisma } from "@/lib/db";
import { addonToClient, normaliseSelection, priceAddons, type AddonLine, type AddonSelection } from "@/lib/addons";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currencies";
import { getRates, rateFor } from "@/lib/fx";
import { loadSnapshot, priceStay, unitsLeft, type InventoryRoom, type StayPrice } from "@/lib/inventory";
import { nightsBetweenIso } from "@/lib/pricing";
import { hotelTodayIso } from "@/lib/utils";

/**
 * v15 · The authoritative quote · server only.
 *
 * Everything a guest is charged comes from here: nightly rates (calendar +
 * yield), packages, deposit, and the display conversion. The booking page
 * shows what this returns; the booking service re-runs it before writing, so a
 * stale or edited client amount can never set the price.
 */

export type QuoteRequest = {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  addons?: AddonSelection[] | unknown;
  currency?: string;
  /** When the booking is being made · defaults to today at the hotel. */
  bookedAtIso?: string;
  /** Ignore this booking when counting inventory (a modification). */
  excludeBookingId?: string;
};

export type Quote = {
  room: Pick<InventoryRoom, "id" | "slug" | "nameEn" | "nameTh" | "rate" | "ota" | "units" | "capacity">;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  stay: StayPrice;
  addons: AddonLine[];
  addonsTotal: number;
  roomTotal: number;
  total: number;
  depositPct: number;
  deposit: number;
  balance: number;
  savingsVsOta: number;
  available: boolean;
  unitsLeft: number;
  /** null when the stay is bookable; the reason otherwise */
  blockedBy: "unavailable" | "min_stay" | "past" | null;
  display: {
    currency: CurrencyCode;
    rate: number;
    rateSource: "live" | "fallback";
    total: number;
    deposit: number;
  };
  quotedAt: string;
};

export type QuoteError = { error: "room_not_found" | "invalid_dates" };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validDates(checkIn: string, checkOut: string): boolean {
  return ISO.test(checkIn) && ISO.test(checkOut) && nightsBetweenIso(checkIn, checkOut) > 0;
}

export async function buildQuote(req: QuoteRequest): Promise<Quote | QuoteError> {
  if (!validDates(req.checkIn, req.checkOut)) return { error: "invalid_dates" };
  const nights = nightsBetweenIso(req.checkIn, req.checkOut);
  const guests = Math.max(1, Math.min(12, Math.floor(req.guests ?? 2) || 2));
  const bookedAtIso = req.bookedAtIso ?? hotelTodayIso();

  const [snap, addonRows, hotel, rates] = await Promise.all([
    loadSnapshot(req.checkIn, req.checkOut, { excludeBookingId: req.excludeBookingId }),
    prisma.addon.findMany({ where: { published: true }, orderBy: { order: "asc" } }),
    prisma.hotel.findUnique({ where: { id: "default" }, select: { depositPct: true } }),
    getRates(),
  ]);

  const room = snap.rooms.find((r) => r.slug === req.roomSlug);
  if (!room) return { error: "room_not_found" };

  const stay = priceStay(snap, room, req.checkIn, req.checkOut, bookedAtIso);
  const left = unitsLeft(snap, room, req.checkIn, req.checkOut);
  const catalogue = addonRows.map(addonToClient);
  const picked = priceAddons(catalogue, normaliseSelection(req.addons), nights, guests);

  const roomTotal = stay.total;
  const total = roomTotal + picked.total;
  const depositPct = hotel?.depositPct ?? 30;
  const deposit = Math.round((total * depositPct) / 100);
  const currency: CurrencyCode = isCurrencyCode(req.currency) ? req.currency : "THB";
  const rate = rateFor(rates, currency);

  const past = req.checkIn < bookedAtIso;
  const blockedBy: Quote["blockedBy"] = past
    ? "past"
    : left <= 0
      ? "unavailable"
      : stay.minStay
        ? "min_stay"
        : null;

  return {
    room: {
      id: room.id,
      slug: room.slug,
      nameEn: room.nameEn,
      nameTh: room.nameTh,
      rate: room.rate,
      ota: room.ota,
      units: room.units,
      capacity: room.capacity,
    },
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    nights,
    guests,
    stay,
    addons: picked.lines,
    addonsTotal: picked.total,
    roomTotal,
    total,
    depositPct,
    deposit,
    balance: total - deposit,
    savingsVsOta: Math.max(0, stay.otaTotal - roomTotal),
    available: blockedBy === null,
    unitsLeft: left,
    blockedBy,
    display: {
      currency,
      rate,
      rateSource: rates.source,
      total: Math.round(total * rate * 100) / 100,
      deposit: Math.round(deposit * rate * 100) / 100,
    },
    quotedAt: new Date().toISOString(),
  };
}

export function isQuoteError(q: Quote | QuoteError): q is QuoteError {
  return "error" in q;
}
