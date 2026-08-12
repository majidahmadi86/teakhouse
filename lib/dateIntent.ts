/**
 * Reads stay dates out of a free-text concierge message.
 *
 * Locale-independent forms (ISO, numeric, day-month) are matched directly.
 * Word forms ("this weekend", "tonight", month names) come from the dictionary
 * so the Thai vocabulary is data, not code: filling the `th` side of the
 * `date.*` keys switches Thai parsing on with no change here.
 *
 * Returns null when the message names no dates · the caller must then never
 * claim availability.
 */

import { DICT } from "./i18n-dict";
import { addDaysIso, nightsBetweenIso, utcToIso } from "./pricing";

export type DateIntentKind =
  | "explicit"
  | "tonight"
  | "tomorrow"
  | "weekend"
  | "nextWeekend"
  | "relative";

export type DateIntent = {
  /** yyyy-mm-dd */
  checkIn: string;
  /** yyyy-mm-dd, exclusive */
  checkOut: string;
  nights: number;
  kind: DateIntentKind;
};

type Lang = "en" | "th";

const MONTH_KEYS = [
  "date.mon.jan",
  "date.mon.feb",
  "date.mon.mar",
  "date.mon.apr",
  "date.mon.may",
  "date.mon.jun",
  "date.mon.jul",
  "date.mon.aug",
  "date.mon.sep",
  "date.mon.oct",
  "date.mon.nov",
  "date.mon.dec",
] as const;

/** Every spelling of a month we accept, mapped to its 0-based index. */
function monthLookup(lang: Lang): Map<string, number> {
  const map = new Map<string, number>();
  MONTH_KEYS.forEach((key, index) => {
    const entry = DICT[key];
    if (!entry) return;
    for (const raw of [entry.en, entry.th]) {
      for (const form of raw.split("|")) {
        const token = form.trim().toLowerCase();
        if (token) map.set(token, index);
      }
    }
    // Always accept the canonical English long and short names too · a Thai
    // speaker writing "20-22 Aug" is the common case, not the exception.
  });
  return map;
}

/** Phrases for a dict key, both languages, lowercased. */
function phrases(key: string): string[] {
  const entry = DICT[key];
  if (!entry) return [];
  return [entry.en, entry.th]
    .flatMap((raw) => raw.split("|"))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => n.length > 0 && haystack.includes(n));
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function isRealDate(year: number, month0: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month0, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month0 &&
    d.getUTCDate() === day
  );
}

/**
 * A bare "20 Aug" means the next 20 Aug, not one in the past · roll forward a
 * year when the date has already gone by.
 */
function resolveYear(todayIso: string, month0: number, day: number): number {
  const year = Number(todayIso.slice(0, 4));
  if (!isRealDate(year, month0, day)) return year + 1;
  const candidate = ymd(year, month0, day);
  return candidate >= todayIso ? year : year + 1;
}

function intent(
  checkIn: string,
  checkOut: string,
  kind: DateIntentKind
): DateIntent | null {
  const nights = nightsBetweenIso(checkIn, checkOut);
  if (nights <= 0 || nights > 30) return null;
  return { checkIn, checkOut, nights, kind };
}

/** Friday of the coming weekend · today when today is already Friday. */
function comingFriday(todayIso: string, weekday: number): string {
  const toFriday = (5 - weekday + 7) % 7;
  return addDaysIso(todayIso, toFriday);
}

export function parseDateIntent(
  message: string,
  today: Date = new Date(),
  lang: Lang = "en"
): DateIntent | null {
  const text = message.toLowerCase();
  const todayIso = utcToIso(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const weekday = today.getDay();

  // ── Explicit dates first · they beat any relative phrase in the message ──

  // 2026-08-20 .. 2026-08-22
  const isoDates = text.match(/\d{4}-\d{2}-\d{2}/g);
  if (isoDates && isoDates.length >= 2) {
    const [a, b] = [isoDates[0], isoDates[1]].sort();
    const found = intent(a, b, "explicit");
    if (found) return found;
  }

  const months = monthLookup(lang);
  const monthAlternatives = Array.from(months.keys())
    .sort((a, b) => b.length - a.length)
    .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (monthAlternatives) {
    // "Aug 20-22", "August 20 to 22"
    const monthFirst = new RegExp(
      `(${monthAlternatives})\\.?\\s*(\\d{1,2})\\s*(?:-|–|to|until|till|through|until)\\s*(\\d{1,2})`,
      "i"
    );
    const mf = text.match(monthFirst);
    if (mf) {
      const month0 = months.get(mf[1].toLowerCase());
      const from = Number(mf[2]);
      const to = Number(mf[3]);
      if (month0 !== undefined && to > from) {
        const year = resolveYear(todayIso, month0, from);
        const found = intent(
          ymd(year, month0, from),
          ymd(year, month0, to),
          "explicit"
        );
        if (found) return found;
      }
    }

    // "20-22 Aug", "20 to 22 August"
    const dayFirst = new RegExp(
      `(\\d{1,2})\\s*(?:-|–|to|until|till|through)\\s*(\\d{1,2})\\s*(${monthAlternatives})`,
      "i"
    );
    const df = text.match(dayFirst);
    if (df) {
      const month0 = months.get(df[3].toLowerCase());
      const from = Number(df[1]);
      const to = Number(df[2]);
      if (month0 !== undefined && to > from) {
        const year = resolveYear(todayIso, month0, from);
        const found = intent(
          ymd(year, month0, from),
          ymd(year, month0, to),
          "explicit"
        );
        if (found) return found;
      }
    }

    // "20 Aug for 3 nights" · a single date plus a night count
    const single = new RegExp(
      `(\\d{1,2})\\s*(${monthAlternatives})|(${monthAlternatives})\\.?\\s*(\\d{1,2})`,
      "i"
    );
    const sg = text.match(single);
    const nightWords = phrases("date.nights");
    const nightMatch = text.match(/(\d{1,2})\s*(?:night|nights|คืน)/i);
    if (sg && (nightMatch || includesAny(text, nightWords))) {
      const day = Number(sg[1] ?? sg[4]);
      const month0 = months.get((sg[2] ?? sg[3] ?? "").toLowerCase());
      const nights = nightMatch ? Number(nightMatch[1]) : 1;
      if (month0 !== undefined && day > 0 && nights > 0) {
        const year = resolveYear(todayIso, month0, day);
        const start = ymd(year, month0, day);
        const found = intent(start, addDaysIso(start, nights), "explicit");
        if (found) return found;
      }
    }
  }

  // "20/8 - 22/8" and "20/08/2026 - 22/08/2026"
  const numeric = text.match(
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*(?:-|–|to|until|till)\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/
  );
  if (numeric) {
    const d1 = Number(numeric[1]);
    const m1 = Number(numeric[2]) - 1;
    const d2 = Number(numeric[4]);
    const m2 = Number(numeric[5]) - 1;
    const y1 = numeric[3]
      ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3])
      : resolveYear(todayIso, m1, d1);
    const y2 = numeric[6]
      ? Number(numeric[6].length === 2 ? `20${numeric[6]}` : numeric[6])
      : m2 < m1
        ? y1 + 1
        : y1;
    if (isRealDate(y1, m1, d1) && isRealDate(y2, m2, d2)) {
      const found = intent(ymd(y1, m1, d1), ymd(y2, m2, d2), "explicit");
      if (found) return found;
    }
  }

  // ── Relative phrases ─────────────────────────────────────────────────────

  if (includesAny(text, phrases("date.nextWeekend"))) {
    const friday = addDaysIso(comingFriday(todayIso, weekday), 7);
    return intent(friday, addDaysIso(friday, 2), "nextWeekend");
  }

  if (includesAny(text, phrases("date.weekend"))) {
    const friday = comingFriday(todayIso, weekday);
    return intent(friday, addDaysIso(friday, 2), "weekend");
  }

  if (includesAny(text, phrases("date.tomorrow"))) {
    const start = addDaysIso(todayIso, 1);
    return intent(start, addDaysIso(start, 1), "tomorrow");
  }

  if (includesAny(text, phrases("date.tonight"))) {
    return intent(todayIso, addDaysIso(todayIso, 1), "tonight");
  }

  if (includesAny(text, phrases("date.nextWeek"))) {
    // Monday of next week, a two-night midweek stay.
    const toMonday = ((1 - weekday + 7) % 7) + 7;
    const monday = addDaysIso(todayIso, toMonday);
    return intent(monday, addDaysIso(monday, 2), "relative");
  }

  return null;
}
