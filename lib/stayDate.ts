/**
 * The stay a guest is searching for · in, out, guests, and optionally a room.
 * Client- and edge-safe (no server imports): the middleware, the /book page,
 * the booking bar and the booking flow all read the stay through this file, so
 * a stay is validated, defaulted and encoded the same way everywhere.
 */

import { HOTEL_TIME_ZONE } from "@/lib/utils";

export type Stay = {
  /** YYYY-MM-DD, the hotel's calendar day */
  in: string;
  /** YYYY-MM-DD, after `in` */
  out: string;
  /** 1..MAX_GUESTS */
  guests: number;
  /** A room slug or short key from a room page, when the guest chose one */
  room?: string;
};

export const MAX_GUESTS = 4;
/** The longest stay the booking bar hands over. */
export const MAX_NIGHTS = 30;
/** How far ahead a stay may start. */
export const MAX_LEAD_DAYS = 548;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ROOM = /^[a-z0-9-]{1,40}$/;

/** The hotel's calendar day for an instant (Asia/Bangkok, the property's clock). */
export function hotelDayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HOTEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "2026-10-08" + 2 → "2026-10-10" (calendar arithmetic, timezone-free). */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days, 12));
  return t.toISOString().slice(0, 10);
}

export function daysBetweenIso(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

function validIso(v: unknown): v is string {
  if (typeof v !== "string" || !ISO.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Tomorrow to the day after, two guests · what every search starts from. */
export function defaultStay(now: Date = new Date()): Stay {
  const today = hotelDayIso(now);
  return { in: addDaysIso(today, 1), out: addDaysIso(today, 2), guests: 2 };
}

/**
 * A stay from untrusted query values. Anything invalid falls back to the
 * default piece by piece: a past or missing check-in becomes tomorrow, a
 * check-out on or before check-in becomes the next day, a stay longer than
 * MAX_NIGHTS is cut to it, guests are clamped to 1..MAX_GUESTS.
 */
export function parseStay(
  q: { in?: string | null; out?: string | null; g?: string | null; room?: string | null },
  now: Date = new Date()
): Stay {
  const today = hotelDayIso(now);
  const def = defaultStay(now);
  let inIso = validIso(q.in) ? q.in : def.in;
  const lead = daysBetweenIso(today, inIso);
  if (lead < 0 || lead > MAX_LEAD_DAYS) inIso = def.in;
  let outIso = validIso(q.out) ? q.out : addDaysIso(inIso, 1);
  const nights = daysBetweenIso(inIso, outIso);
  if (nights < 1) outIso = addDaysIso(inIso, 1);
  if (nights > MAX_NIGHTS) outIso = addDaysIso(inIso, MAX_NIGHTS);
  const g = Number.parseInt(q.g ?? "", 10);
  const guests = Number.isFinite(g) ? Math.min(MAX_GUESTS, Math.max(1, g)) : def.guests;
  const room = q.room && ROOM.test(q.room) ? q.room : undefined;
  return { in: inIso, out: outIso, guests, ...(room ? { room } : {}) };
}

/**
 * The stay as path segments · the middleware rewrites /book?in&out&g&room to
 * /<lang>/book/<in>/<out>/<g>[/<room>], so /book renders statically per stay
 * (ISR) and still reads the stay on the server.
 */
export function stayToSegments(s: Stay): string[] {
  return [s.in, s.out, String(s.guests), ...(s.room ? [s.room] : [])];
}

export function stayFromSegments(seg: string[] | undefined): Stay | null {
  if (!seg || seg.length < 3 || seg.length > 4) return null;
  const [inIso, outIso, g, room] = seg;
  if (!validIso(inIso) || !validIso(outIso)) return null;
  const guests = Number.parseInt(g, 10);
  if (!Number.isFinite(guests) || guests < 1 || guests > MAX_GUESTS) return null;
  if (daysBetweenIso(inIso, outIso) < 1) return null;
  if (room !== undefined && !ROOM.test(room)) return null;
  return { in: inIso, out: outIso, guests, ...(room ? { room } : {}) };
}
