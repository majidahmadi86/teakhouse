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

export function addDays(d: Date, days: number): Date {
  return addDaysFn(d, days);
}

export function parseISODate(iso: string): Date {
  return parseISO(iso);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
