/**
 * The stay range · the one rule set every date picker on the site follows
 * (the booking bar's calendar on every guest page and the /book calendar).
 *
 * Pure and dependency free, so it is the same in the browser, on the server
 * and in the gate (scripts/date-range-gate.js runs it directly).
 *
 * Days are civil ISO dates ("2026-10-08"): plain string comparison orders
 * them, and no time zone can move them.
 *
 * Mike's bug (2026-10): the old picker derived the next range from
 * react-day-picker's own guess at a range and then picked "the end that
 * moved", so a click before the arrival kept the OLD check-out as the new
 * arrival and the label could read check-out before check-in. Here a click
 * is interpreted once, against the range we hold, and a range can only ever
 * be stored as arrival < departure.
 */

export type DayIso = string;

export type StayRange = {
  /** Arrival · null before the first click. */
  from: DayIso | null;
  /** Departure · null while only the arrival is chosen. */
  to: DayIso | null;
};

/** Which end the guest opened the calendar from. */
export type RangeFocus = "in" | "out";

export const MAX_STAY_NIGHTS = 30;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isDayIso(v: unknown): v is DayIso {
  if (typeof v !== "string" || !ISO.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function addDays(iso: DayIso, n: number): DayIso {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

export function nightsOf(from: DayIso, to: DayIso): number {
  const [ya, ma, da] = from.split("-").map(Number);
  const [yb, mb, db] = to.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

/**
 * The range after the guest picks `day`.
 *
 * - No arrival yet, or a complete range: the click starts a new range
 *   (arrival = day). Opened from the check-out field with an arrival held,
 *   a later day sets the departure instead, the way the field promises.
 * - Arrival held, no departure: a day AFTER the arrival is the departure;
 *   a day on or before the arrival restarts the range from that day.
 * - A departure is never more than MAX_STAY_NIGHTS after the arrival; a
 *   later click restarts the range from the clicked day.
 *
 * So `from < to` holds for every complete range this returns.
 */
export function pickDay(range: StayRange, day: DayIso, focus: RangeFocus = "in"): StayRange {
  const { from, to } = range;
  const restart: StayRange = { from: day, to: null };
  if (!from) return restart;
  const settingDeparture = !to || focus === "out";
  if (!settingDeparture) return restart;
  if (day <= from) return restart;
  if (nightsOf(from, day) > MAX_STAY_NIGHTS) return restart;
  return { from, to: day };
}

/** Is the range complete and in order? */
export function isComplete(range: StayRange): range is { from: DayIso; to: DayIso } {
  return Boolean(range.from && range.to && range.from < range.to);
}

/**
 * Any two dates as an ordered stay: swapped if they arrive reversed, the
 * departure moved to the next day when it is not after the arrival. What a
 * form, a URL or an old saved value hands us is repaired here, never shown
 * reversed.
 */
export function orderedStay(a: DayIso, b: DayIso | null | undefined): { from: DayIso; to: DayIso } {
  if (!b || b === a) return { from: a, to: addDays(a, 1) };
  return a < b ? { from: a, to: b } : { from: b, to: a };
}

/** Where a day sits relative to a range · drives the calendar's cell styling. */
export function dayRole(
  range: StayRange,
  day: DayIso,
  hover?: DayIso | null
): "start" | "end" | "middle" | "single" | null {
  const { from } = range;
  let to = range.to;
  if (from && !to && hover && hover > from && nightsOf(from, hover) <= MAX_STAY_NIGHTS) to = hover;
  if (!from) return null;
  if (!to) return day === from ? "single" : null;
  if (day === from) return "start";
  if (day === to) return "end";
  if (day > from && day < to) return "middle";
  return null;
}

/** The month grid for a month · weeks of ISO days, null for padding cells. */
export function monthGrid(year: number, month0: number, weekStartsOn: 0 | 1): (DayIso | null)[][] {
  const first = new Date(Date.UTC(year, month0, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0, 12)).getUTCDate();
  const lead = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const cells: (DayIso | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(Date.UTC(year, month0, d, 12)).toISOString().slice(0, 10));
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (DayIso | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
