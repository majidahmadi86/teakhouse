/**
 * v15 · Currency catalogue + formatting · client-safe, no server imports.
 *
 * The base currency is THB (every stored amount is baht). Everything else is a
 * DISPLAY conversion at the rate of the moment, and a receipt records the rate
 * it used so it can be re-issued identically later.
 */

export type CurrencyCode =
  | "THB"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CNY"
  | "SGD"
  | "AUD"
  | "HKD"
  | "KRW"
  | "CHF"
  | "AED"
  | "INR";

export type CurrencyMeta = {
  code: CurrencyCode;
  symbol: string;
  /** Digits shown after the decimal point · 0 for currencies quoted whole. */
  decimals: number;
  label: string;
};

export const CURRENCY_CATALOGUE: Record<CurrencyCode, CurrencyMeta> = {
  THB: { code: "THB", symbol: "฿", decimals: 0, label: "฿ THB" },
  USD: { code: "USD", symbol: "$", decimals: 0, label: "$ USD" },
  EUR: { code: "EUR", symbol: "€", decimals: 0, label: "€ EUR" },
  GBP: { code: "GBP", symbol: "£", decimals: 0, label: "£ GBP" },
  JPY: { code: "JPY", symbol: "¥", decimals: 0, label: "¥ JPY" },
  CNY: { code: "CNY", symbol: "¥", decimals: 0, label: "¥ CNY" },
  SGD: { code: "SGD", symbol: "S$", decimals: 0, label: "S$ SGD" },
  AUD: { code: "AUD", symbol: "A$", decimals: 0, label: "A$ AUD" },
  HKD: { code: "HKD", symbol: "HK$", decimals: 0, label: "HK$ HKD" },
  KRW: { code: "KRW", symbol: "₩", decimals: 0, label: "₩ KRW" },
  CHF: { code: "CHF", symbol: "CHF", decimals: 0, label: "CHF" },
  AED: { code: "AED", symbol: "AED", decimals: 0, label: "AED" },
  INR: { code: "INR", symbol: "₹", decimals: 0, label: "₹ INR" },
};

export const CURRENCY_CODES = Object.keys(CURRENCY_CATALOGUE) as CurrencyCode[];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCY_CATALOGUE;
}

/** THB → X multipliers · the offline table, refreshed live by lib/fx. */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  THB: 1,
  USD: 1 / 36,
  EUR: 1 / 39,
  GBP: 1 / 45.5,
  JPY: 4.15,
  CNY: 0.2,
  SGD: 0.0375,
  AUD: 0.042,
  HKD: 0.216,
  KRW: 38.5,
  CHF: 0.0245,
  AED: 0.102,
  INR: 2.32,
};

export type RateTable = {
  base: "THB";
  rates: Record<CurrencyCode, number>;
  /** ISO date the table is for */
  date: string;
  /** "live" (ECB via Frankfurter) or "fallback" (the offline table) */
  source: "live" | "fallback";
};

export const FALLBACK_TABLE: RateTable = {
  base: "THB",
  rates: FALLBACK_RATES,
  date: "static",
  source: "fallback",
};

export function convertFromThb(
  amountThb: number,
  code: CurrencyCode,
  rates: Record<CurrencyCode, number> = FALLBACK_RATES
): number {
  if (code === "THB") return amountThb;
  const r = rates[code] ?? FALLBACK_RATES[code];
  return amountThb * r;
}

/** "฿2,400" · "$67" · "¥9,960" · rounded the way a hotel quotes. */
export function formatMoney(amount: number, code: CurrencyCode): string {
  const meta = CURRENCY_CATALOGUE[code];
  const rounded =
    meta.decimals === 0 ? Math.round(amount) : Number(amount.toFixed(meta.decimals));
  const digits = rounded.toLocaleString("en-US", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  if (code === "CHF" || code === "AED") return `${meta.symbol} ${digits}`;
  return `${meta.symbol}${digits}`;
}

export function formatConverted(
  amountThb: number,
  code: CurrencyCode,
  rates?: Record<CurrencyCode, number>
): string {
  return formatMoney(convertFromThb(amountThb, code, rates), code);
}
