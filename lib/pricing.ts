/**
 * Per-day pricing engine · the single source of truth for what a night costs.
 *
 * Precedence, highest first:
 *   1. override  · specific dates (holidays, events) set by the owner
 *   2. season    · a date range (high season, weekend premium)
 *   3. base      · room.rate
 *
 * Within one layer the narrower range wins, so a 3-day Songkran override beats
 * a 3-month high season, and a 2-day weekend premium beats a 3-month season.
 * A rule prices a night either as a fixed `price` (baht) or as a `multiplier`
 * of the room's base rate · `price` wins when both are set.
 *
 * Pure and dependency free on purpose: it runs unchanged in the booking page,
 * the owner rate calendar, the concierge availability tool, and the API.
 */

export type PriceRuleKind = "season" | "override";

export type PriceRule = {
  id: string;
  roomId: string;
  kind: PriceRuleKind;
  label: string;
  /** yyyy-mm-dd, inclusive */
  startDate: string;
  /** yyyy-mm-dd, inclusive */
  endDate: string;
  multiplier: number | null;
  price: number | null;
};

export type NightSource = "base" | PriceRuleKind;

export type NightRate = {
  /** yyyy-mm-dd of the night (the date you sleep on) */
  date: string;
  price: number;
  source: NightSource;
  label: string;
  ruleId: string | null;
};

export type StayQuote = {
  nights: NightRate[];
  /** Sum of the nightly rates · the stay total. */
  total: number;
  /** What the same stay would cost at the flat base rate. */
  baseTotal: number;
  /** True when the stay spans more than one distinct nightly price. */
  mixed: boolean;
  minNight: number;
  maxNight: number;
};

/* ── ISO date helpers · UTC-anchored so they never drift with the TZ ─────── */

const DAY_MS = 86_400_000;

export function isoToUtc(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}

export function utcToIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  return utcToIso(isoToUtc(iso) + days * DAY_MS);
}

export function nightsBetweenIso(inIso: string, outIso: string): number {
  const n = Math.round((isoToUtc(outIso) - isoToUtc(inIso)) / DAY_MS);
  return n > 0 ? n : 0;
}

/** The nights actually slept: check-in .. check-out - 1. */
export function eachNightIso(inIso: string, outIso: string): string[] {
  const out: string[] = [];
  const nights = nightsBetweenIso(inIso, outIso);
  for (let i = 0; i < nights; i++) out.push(addDaysIso(inIso, i));
  return out;
}

/* ── Rule resolution ─────────────────────────────────────────────────────── */

const KIND_RANK: Record<PriceRuleKind, number> = { override: 0, season: 1 };

function spanDays(rule: PriceRule): number {
  return Math.max(1, nightsBetweenIso(rule.startDate, rule.endDate) + 1);
}

function coversDate(rule: PriceRule, dateIso: string): boolean {
  // ISO yyyy-mm-dd compares correctly as a plain string.
  return rule.startDate <= dateIso && dateIso <= rule.endDate;
}

function priceFromRule(baseRate: number, rule: PriceRule): number {
  if (typeof rule.price === "number" && rule.price > 0) {
    return Math.round(rule.price);
  }
  if (typeof rule.multiplier === "number" && rule.multiplier > 0) {
    return Math.round(baseRate * rule.multiplier);
  }
  return Math.round(baseRate);
}

/**
 * The rule that owns a given date, or null when the base rate applies.
 * Deterministic: kind, then narrower range, then id · so two clients computing
 * the same date always agree.
 */
export function ruleForDate(
  dateIso: string,
  rules: readonly PriceRule[]
): PriceRule | null {
  let best: PriceRule | null = null;
  for (const rule of rules) {
    if (!coversDate(rule, dateIso)) continue;
    if (!best) {
      best = rule;
      continue;
    }
    const a = KIND_RANK[rule.kind] - KIND_RANK[best.kind];
    if (a !== 0) {
      if (a < 0) best = rule;
      continue;
    }
    const span = spanDays(rule) - spanDays(best);
    if (span !== 0) {
      if (span < 0) best = rule;
      continue;
    }
    if (rule.id < best.id) best = rule;
  }
  return best;
}

/** The effective nightly rate for one date. */
export function nightlyRate(
  baseRate: number,
  dateIso: string,
  rules: readonly PriceRule[]
): NightRate {
  const rule = ruleForDate(dateIso, rules);
  if (!rule) {
    return {
      date: dateIso,
      price: Math.round(baseRate),
      source: "base",
      label: "",
      ruleId: null,
    };
  }
  return {
    date: dateIso,
    price: priceFromRule(baseRate, rule),
    source: rule.kind,
    label: rule.label,
    ruleId: rule.id,
  };
}

/**
 * A stay priced as the SUM OF NIGHTLY RATES · never rate × nights.
 * Returns an empty quote for a zero-night range so callers can render safely.
 */
export function quoteStay(
  baseRate: number,
  checkInIso: string,
  checkOutIso: string,
  rules: readonly PriceRule[]
): StayQuote {
  const nights = eachNightIso(checkInIso, checkOutIso).map((date) =>
    nightlyRate(baseRate, date, rules)
  );

  if (nights.length === 0) {
    return {
      nights,
      total: 0,
      baseTotal: 0,
      mixed: false,
      minNight: 0,
      maxNight: 0,
    };
  }

  const prices = nights.map((n) => n.price);
  const total = prices.reduce((sum, p) => sum + p, 0);
  const minNight = Math.min(...prices);
  const maxNight = Math.max(...prices);

  return {
    nights,
    total,
    baseTotal: Math.round(baseRate) * nights.length,
    mixed: minNight !== maxNight,
    minNight,
    maxNight,
  };
}

/**
 * Adjacent nights on the same rule collapsed into one receipt line
 * ("฿4,290 × 2 nights · High season"), in stay order.
 */
export type RateLine = {
  from: string;
  to: string;
  nights: number;
  price: number;
  source: NightSource;
  label: string;
};

export function groupNights(nights: readonly NightRate[]): RateLine[] {
  const lines: RateLine[] = [];
  for (const night of nights) {
    const last = lines[lines.length - 1];
    if (last && last.price === night.price && last.label === night.label) {
      last.nights += 1;
      last.to = night.date;
      continue;
    }
    lines.push({
      from: night.date,
      to: night.date,
      nights: 1,
      price: night.price,
      source: night.source,
      label: night.label,
    });
  }
  return lines;
}

/** Effective nightly price for every date in a month · the rate calendar grid. */
export function rateCalendarMonth(
  baseRate: number,
  year: number,
  month0: number,
  rules: readonly PriceRule[]
): NightRate[] {
  const first = new Date(Date.UTC(year, month0, 1));
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const startIso = utcToIso(first.getTime());
  return Array.from({ length: days }, (_, i) =>
    nightlyRate(baseRate, addDaysIso(startIso, i), rules)
  );
}

/**
 * What the same stay would cost on an OTA. The OTA markup is a property of the
 * room (rate vs ota), so it scales with the nightly rate rather than being a
 * flat per-night difference · a premium night is marked up proportionally too.
 */
export function otaEquivalent(
  stayTotal: number,
  baseRate: number,
  otaRate: number
): number {
  if (baseRate <= 0) return stayTotal;
  return Math.round(stayTotal * (otaRate / baseRate));
}

/** Cheapest nightly rate across a set of rooms for one date · "from ฿x". */
export function lowestNightlyRate(
  rooms: readonly { rate: number; id: string }[],
  dateIso: string,
  rulesByRoom: Record<string, PriceRule[]>
): number | null {
  let min: number | null = null;
  for (const room of rooms) {
    const price = nightlyRate(room.rate, dateIso, rulesByRoom[room.id] ?? []).price;
    if (min === null || price < min) min = price;
  }
  return min;
}

/** Narrow DB/DTO rows (multiplier/price/kind may be loose) into PriceRule. */
export function toPriceRule(row: {
  id: string;
  roomId: string;
  kind?: string | null;
  label?: string | null;
  startDate: string;
  endDate: string;
  multiplier?: number | null;
  price?: number | null;
}): PriceRule {
  return {
    id: row.id,
    roomId: row.roomId,
    kind: row.kind === "override" ? "override" : "season",
    label: row.label ?? "",
    startDate: row.startDate,
    endDate: row.endDate,
    multiplier: typeof row.multiplier === "number" ? row.multiplier : null,
    price: typeof row.price === "number" ? row.price : null,
  };
}

/** Index rules by roomId · what every consumer actually wants. */
export function groupRulesByRoom(
  rules: readonly PriceRule[]
): Record<string, PriceRule[]> {
  const out: Record<string, PriceRule[]> = {};
  for (const rule of rules) {
    (out[rule.roomId] ??= []).push(rule);
  }
  return out;
}
