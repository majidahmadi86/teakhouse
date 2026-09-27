import type { NightRate } from "@/lib/pricing";

/**
 * v15 · Yield management · the demand layer on top of the per-day rate.
 *
 * Pure and dependency free, like lib/pricing. The per-day engine answers
 * "what does this night cost by the calendar"; this answers "and what does
 * demand do to it". The two are separate on purpose: a season rule is a fact
 * the owner set, a yield rule is a policy that reacts to the live house.
 *
 *   occupancy  · the house is >= threshold% full that night → × multiplier
 *   lead_time  · booked >= threshold days ahead → × multiplier (early bird)
 *                with maxLeadDays: booked <= maxLeadDays ahead → × (last minute)
 *   min_stay   · a stay shorter than minNights is refused for covered dates
 *
 * Multipliers stack multiplicatively and the product is clamped to
 * [MIN_FACTOR, MAX_FACTOR], so no combination of rules can halve or triple a
 * rate by accident. Deterministic: same inputs, same price, on every surface.
 */

export type YieldKind = "occupancy" | "lead_time" | "min_stay";

export type YieldRule = {
  id: string;
  roomId: string | null;
  kind: YieldKind;
  label: string;
  threshold: number;
  maxLeadDays: number | null;
  multiplier: number;
  minNights: number;
  startDate: string | null;
  endDate: string | null;
  enabled: boolean;
};

export type YieldNight = NightRate & {
  /** price before yield · what the calendar alone would charge */
  calendarPrice: number;
  yieldFactor: number;
  yieldLabels: string[];
  /** 0..1 share of the house's units already sold that night */
  occupancy: number;
};

export type YieldContext = {
  roomId: string;
  rules: readonly YieldRule[];
  /** Occupancy for a night as 0..1 · computed from the live inventory snapshot. */
  occupancyFor: (dateIso: string) => number;
  /** Days between the booking moment and check-in. */
  leadDays: number;
  nightsCount: number;
};

export type YieldResult = {
  nights: YieldNight[];
  minStay: { minNights: number; label: string } | null;
};

const MIN_FACTOR = 0.6;
const MAX_FACTOR = 2.0;

function covers(rule: YieldRule, dateIso: string): boolean {
  if (rule.startDate && dateIso < rule.startDate) return false;
  if (rule.endDate && dateIso > rule.endDate) return false;
  return true;
}

function appliesToRoom(rule: YieldRule, roomId: string): boolean {
  return rule.roomId === null || rule.roomId === roomId;
}

export function applyYield(nights: readonly NightRate[], ctx: YieldContext): YieldResult {
  const active = ctx.rules.filter((r) => r.enabled && appliesToRoom(r, ctx.roomId));

  let minStay: YieldResult["minStay"] = null;
  for (const rule of active) {
    if (rule.kind !== "min_stay") continue;
    const touched = nights.some((n) => covers(rule, n.date));
    if (touched && ctx.nightsCount < rule.minNights) {
      if (!minStay || rule.minNights > minStay.minNights) {
        minStay = { minNights: rule.minNights, label: rule.label };
      }
    }
  }

  const out: YieldNight[] = nights.map((night) => {
    let factor = 1;
    const labels: string[] = [];
    const occupancy = Math.max(0, Math.min(1, ctx.occupancyFor(night.date)));

    for (const rule of active) {
      if (!covers(rule, night.date)) continue;
      if (rule.kind === "occupancy") {
        if (occupancy * 100 >= rule.threshold) {
          factor *= rule.multiplier;
          if (rule.label) labels.push(rule.label);
        }
      } else if (rule.kind === "lead_time") {
        const hit =
          rule.maxLeadDays !== null
            ? ctx.leadDays <= rule.maxLeadDays
            : ctx.leadDays >= rule.threshold;
        if (hit) {
          factor *= rule.multiplier;
          if (rule.label) labels.push(rule.label);
        }
      }
    }

    factor = Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, factor));
    const price = Math.round(night.price * factor);
    return {
      ...night,
      calendarPrice: night.price,
      price,
      yieldFactor: Number(factor.toFixed(4)),
      yieldLabels: labels,
      occupancy: Number(occupancy.toFixed(3)),
      // the receipt line label · calendar label first, then the yield reason
      label: [night.label, ...labels].filter(Boolean).join(" · "),
    };
  });

  return { nights: out, minStay };
}

/** Narrow a DB row into a YieldRule. */
export function toYieldRule(row: {
  id: string;
  roomId: string | null;
  kind: string;
  label?: string | null;
  threshold?: number | null;
  maxLeadDays?: number | null;
  multiplier?: number | null;
  minNights?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean | null;
}): YieldRule {
  const kind: YieldKind =
    row.kind === "occupancy" || row.kind === "lead_time" || row.kind === "min_stay"
      ? row.kind
      : "occupancy";
  return {
    id: row.id,
    roomId: row.roomId ?? null,
    kind,
    label: row.label ?? "",
    threshold: typeof row.threshold === "number" ? row.threshold : 0,
    maxLeadDays: typeof row.maxLeadDays === "number" ? row.maxLeadDays : null,
    multiplier: typeof row.multiplier === "number" && row.multiplier > 0 ? row.multiplier : 1,
    minNights: typeof row.minNights === "number" && row.minNights > 0 ? row.minNights : 1,
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    enabled: row.enabled !== false,
  };
}
