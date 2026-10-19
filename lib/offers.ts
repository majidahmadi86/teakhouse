import { addDaysIso, daysBetweenIso } from "./stayDate";

/**
 * v18 · The three direct-booking offers on /offers, as rules the quote can
 * apply. Shared by /book (what the guest sees) and POST /api/bookings (what the
 * house charges), so the two can never disagree.
 *
 * No schema change: the offer is identified by a short id carried in the
 * /book address (?offer=) and in the booking request; the booking row keeps
 * the final amount and a note naming the offer.
 *
 *   early   · arrival at least 30 days ahead → 15% off the stay
 *   longer  · four nights or more            → 20% off the stay
 *   arrival · three nights or more           → private airport transfer
 *             included; the room price is unchanged
 */
export type OfferId = "early" | "longer" | "arrival";

export const OFFER_IDS: readonly OfferId[] = ["early", "longer", "arrival"];

/** The /offers card number (off.<n>.*) each offer's copy lives under. */
export const OFFER_NUMBER: Record<OfferId, "1" | "2" | "3"> = {
  early: "1",
  longer: "2",
  arrival: "3",
};

export function isOfferId(v: unknown): v is OfferId {
  return typeof v === "string" && (OFFER_IDS as readonly string[]).includes(v);
}

export type OfferResult = {
  offer: OfferId;
  /** The stay meets the offer's terms. */
  eligible: boolean;
  /** The stay total after the offer (equal to the input when not eligible). */
  total: number;
  /** What the offer takes off the stay, in baht (0 for the transfer offer). */
  saved: number;
  /** For a stay that does not qualify yet: what it needs, for the copy. */
  needs: { minNights?: number; minLeadDays?: number } | null;
};

const EARLY_LEAD_DAYS = 30;
const EARLY_PCT = 15;
const LONGER_NIGHTS = 4;
const LONGER_PCT = 20;
const ARRIVAL_NIGHTS = 3;

/**
 * Apply one offer to a quoted stay total. `todayIso` is the hotel's calendar
 * day (lib/stayDate hotelDayIso) so the early-booking window is measured on
 * the property's clock on both sides.
 */
export function applyOffer(
  offer: OfferId,
  stayTotal: number,
  checkIn: string,
  checkOut: string,
  todayIso: string
): OfferResult {
  const nights = Math.max(0, daysBetweenIso(checkIn, checkOut));
  const pctOff = (pct: number) => Math.round((stayTotal * pct) / 100);

  if (offer === "early") {
    const ok = checkIn >= addDaysIso(todayIso, EARLY_LEAD_DAYS);
    const saved = ok ? pctOff(EARLY_PCT) : 0;
    return {
      offer,
      eligible: ok,
      total: stayTotal - saved,
      saved,
      needs: ok ? null : { minLeadDays: EARLY_LEAD_DAYS },
    };
  }
  if (offer === "longer") {
    const ok = nights >= LONGER_NIGHTS;
    const saved = ok ? pctOff(LONGER_PCT) : 0;
    return {
      offer,
      eligible: ok,
      total: stayTotal - saved,
      saved,
      needs: ok ? null : { minNights: LONGER_NIGHTS },
    };
  }
  const ok = nights >= ARRIVAL_NIGHTS;
  return {
    offer,
    eligible: ok,
    total: stayTotal,
    saved: 0,
    needs: ok ? null : { minNights: ARRIVAL_NIGHTS },
  };
}

/** The English note stored on the booking row, read by the owner. */
export function offerNote(result: OfferResult): string {
  if (!result.eligible) return "";
  if (result.offer === "early") return "Offer: Early booking (15% off the stay)";
  if (result.offer === "longer") return "Offer: Stay longer (20% off the stay)";
  return "Offer: Private arrival (airport transfer included)";
}
