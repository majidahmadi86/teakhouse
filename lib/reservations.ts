/**
 * v13 · Table reservations · client shape, DB mapper, and the shared rules the
 * guest form and the API both validate against. No deposit and no payment: a
 * reservation is a promise to hold a table, nothing more.
 */

export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "cancelled",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export type ContactKind = "phone" | "line";

export type TableReservation = {
  id: string;
  ref: string;
  date: string;
  time: string;
  party: number;
  name: string;
  contact: string;
  contactKind: ContactKind;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
};

export type DbTableReservation = {
  id: string;
  ref: string;
  date: string;
  time: string;
  party: number;
  name: string;
  contact: string;
  contactKind: string;
  notes: string;
  status: string;
  createdAt: Date;
};

/** Service window + party cap · the owner-editable half of the form's rules. */
export type ReservationSettings = {
  reservationsEnabled: boolean;
  serviceStart: string;
  serviceEnd: string;
  maxPartySize: number;
};

export const RESERVATION_DEFAULTS: ReservationSettings = {
  reservationsEnabled: true,
  serviceStart: "11:30",
  serviceEnd: "22:00",
  maxPartySize: 10,
};

export function reservationToClient(r: DbTableReservation): TableReservation {
  return {
    id: r.id,
    ref: r.ref,
    date: r.date,
    time: r.time,
    party: r.party,
    name: r.name,
    contact: r.contact,
    contactKind: r.contactKind === "line" ? "line" : "phone",
    notes: r.notes,
    status: (RESERVATION_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as ReservationStatus)
      : "pending",
    createdAt: r.createdAt.toISOString(),
  };
}

function toMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Bookable times · every half hour from the start of service to one hour
 * before the kitchen closes, so the last table still gets a full sitting.
 * A window too short for that rule falls back to the opening time alone,
 * which is honest: there is exactly one sitting left.
 */
export function serviceSlots(
  serviceStart: string,
  serviceEnd: string
): string[] {
  const start = toMinutes(serviceStart);
  const end = toMinutes(serviceEnd);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return [serviceStart];
  }
  const last = end - 60;
  if (last < start) return [fromMinutes(start)];
  const out: string[] = [];
  for (let t = start; t <= last; t += 30) out.push(fromMinutes(t));
  return out;
}

/**
 * Human 24h label. The numerals are the same in both locales; the word between
 * them is not, so the separator follows the locale ("to" / "ถึง").
 */
export function formatServiceWindow(
  serviceStart: string,
  serviceEnd: string,
  locale: "en" | "th" = "en"
): string {
  return `${serviceStart} ${locale === "th" ? "ถึง" : "to"} ${serviceEnd}`;
}

export type ReservationInput = {
  date: string;
  time: string;
  party: number;
  name: string;
  contact: string;
  contactKind: ContactKind;
  notes?: string;
};

export type ValidationError =
  | "date"
  | "time"
  | "party"
  | "name"
  | "contact"
  | "closed";

/**
 * The one validator · the server action and the API route both call it, so a
 * guest with JS off and a guest with JS on are held to identical rules.
 * `todayIso` is passed in rather than read from the clock so the caller owns
 * the timezone decision.
 */
export function validateReservation(
  input: ReservationInput,
  settings: ReservationSettings,
  todayIso: string
): ValidationError | null {
  if (!settings.reservationsEnabled) return "closed";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date < todayIso) {
    return "date";
  }
  if (!serviceSlots(settings.serviceStart, settings.serviceEnd).includes(input.time)) {
    return "time";
  }
  if (
    !Number.isInteger(input.party) ||
    input.party < 1 ||
    input.party > settings.maxPartySize
  ) {
    return "party";
  }
  if (input.name.trim().length < 2) return "name";
  if (input.contact.trim().length < 4) return "contact";
  return null;
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Guest-facing reference · TBL- plus four characters, no look-alike glyphs
 * (no 0/O, 1/I) because these get read aloud down a phone line.
 */
export function makeReservationRef(): string {
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `TBL-${out}`;
}
