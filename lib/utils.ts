import {
  addDays as addDaysFn,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";

export function formatBaht(n: number): string {
  return "฿" + n.toLocaleString("en-US");
}

export function nightsBetween(isoIn: string, isoOut: string): number {
  const nights = differenceInCalendarDays(parseISO(isoOut), parseISO(isoIn));
  return nights > 0 ? nights : 1;
}

export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** The hotel's own clock · every default date a guest is shown comes from here. */
export const HOTEL_TIME_ZONE = "Asia/Bangkok";

/**
 * Today at the hotel, as a local Date at midnight.
 *
 * v14 · the fix for a real guest-facing bug. /book prefilled tonight's stay
 * from `new Date()`, which is the SERVER's day when the page is rendered (UTC
 * on Vercel) and the BROWSER's day after hydration. For a guest in Bangkok
 * between midnight and 07:00 those are different days, so the date box visibly
 * jumped forward a day about 300ms after load.
 *
 * Both sides now ask the same question · what day is it at the hotel · so both
 * sides get the same answer, and the answer is the one that matters to someone
 * booking a room in Bangkok. Uses Intl rather than a timezone library so it
 * costs nothing at runtime; a runtime without the tz database falls back to
 * local time, which is the old behaviour rather than a crash.
 */
export function hotelToday(now: Date = new Date()): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: HOTEL_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const [y, m, d] = parts.split("-").map(Number);
    return new Date(y, m - 1, d);
  } catch {
    const fallback = new Date(now);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
}

/** Today at the hotel as yyyy-mm-dd. */
export function hotelTodayIso(now: Date = new Date()): string {
  return isoDate(hotelToday(now));
}

export function addDays(d: Date, days: number): Date {
  return addDaysFn(d, days);
}

export function parseISODate(iso: string): Date {
  return parseISO(iso);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
