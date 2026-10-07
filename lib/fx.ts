import { unstable_cache } from "next/cache";
import {
  CURRENCY_CODES,
  FALLBACK_RATES,
  FALLBACK_TABLE,
  type CurrencyCode,
  type RateTable,
} from "@/lib/currencies";

/**
 * v15 · Live exchange rates · server only.
 *
 * Source: Frankfurter (ECB reference rates, free, no key). Cached for an hour
 * under the "fx" tag. The cached function THROWS on any failure so a bad
 * fetch is never cached (see lib/cachedData.ts for why that matters); the
 * wrapper returns the offline table instead, marked `source: "fallback"` so the
 * UI can say the rate is indicative.
 *
 * AED is pegged to USD at 3.6725 and is not an ECB currency, so it is derived.
 */

export const TAG_FX = "fx";
const HOUR = 3600;
const AED_PER_USD = 3.6725;

const readRates = unstable_cache(
  async (): Promise<RateTable> => {
    const want = CURRENCY_CODES.filter((c) => c !== "THB" && c !== "AED");
    const url = `https://api.frankfurter.app/latest?from=THB&to=${want.join(",")}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const data = (await res.json()) as { date?: string; rates?: Record<string, number> };
    if (!data.rates || typeof data.rates.USD !== "number") {
      throw new Error("frankfurter · malformed body");
    }
    const rates = { ...FALLBACK_RATES };
    for (const code of want) {
      const v = data.rates[code];
      if (typeof v === "number" && v > 0) rates[code] = v;
    }
    rates.AED = rates.USD * AED_PER_USD;
    rates.THB = 1;
    return { base: "THB", rates, date: data.date ?? "", source: "live" };
  },
  ["fx-rates-v15"],
  { tags: [TAG_FX], revalidate: HOUR }
);

export async function getRates(): Promise<RateTable> {
  try {
    return await readRates();
  } catch (e) {
    console.warn("[fx] live rates unavailable · serving fallback table", e);
    return FALLBACK_TABLE;
  }
}

export function rateFor(table: RateTable, code: CurrencyCode): number {
  return code === "THB" ? 1 : table.rates[code] ?? FALLBACK_RATES[code];
}
