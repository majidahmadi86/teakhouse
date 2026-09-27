"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hotelConfig } from "@/config/hotel.config";
import {
  CURRENCY_CATALOGUE,
  FALLBACK_RATES,
  convertFromThb as convert,
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
  type RateTable,
} from "@/lib/currencies";

/**
 * v15 · Multi-currency with live rates.
 *
 * THB is the base; every other currency is a display conversion. The provider
 * starts from the offline table (so the first paint never waits on a fetch),
 * then loads /api/fx once per session and re-renders every price. The guest's
 * pick persists in localStorage; the rate used is exposed so a receipt can
 * record it.
 */

export type Currency = CurrencyCode;

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] =
  hotelConfig.currencies
    .filter(isCurrencyCode)
    .map((code) => ({ code, symbol: CURRENCY_CATALOGUE[code].symbol, label: CURRENCY_CATALOGUE[code].label }));

const STORAGE_KEY = "tkh-cur";

/** Static conversion · kept for server-free callers (uses the offline table). */
export function convertFromThb(amountThb: number, currency: Currency): number {
  return convert(amountThb, currency, FALLBACK_RATES);
}

/** Guest-facing price with the offline table · THB keeps ฿2,400. */
export function formatPrice(amountThb: number, currency: Currency): string {
  return formatMoney(convert(amountThb, currency, FALLBACK_RATES), currency);
}

type CurrencyCtx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amountThb: number) => string;
  /** THB → current currency multiplier in use */
  rate: number;
  rates: RateTable;
  /** "live" once /api/fx has answered, "fallback" before or when it cannot */
  rateSource: "live" | "fallback";
};

const Ctx = createContext<CurrencyCtx | null>(null);

const INITIAL_TABLE: RateTable = { base: "THB", rates: FALLBACK_RATES, date: "static", source: "fallback" };

let cachedTable: RateTable | null = null;
let inflight: Promise<RateTable> | null = null;

async function loadRates(): Promise<RateTable> {
  if (cachedTable) return cachedTable;
  if (!inflight) {
    inflight = fetch("/api/fx")
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const t = (await r.json()) as RateTable;
        if (!t?.rates?.USD) throw new Error("bad table");
        cachedTable = { ...t, rates: { ...FALLBACK_RATES, ...t.rates } };
        return cachedTable;
      })
      .catch(() => INITIAL_TABLE)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("THB");
  const [ready, setReady] = useState(false);
  const [table, setTable] = useState<RateTable>(cachedTable ?? INITIAL_TABLE);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (isCurrencyCode(s) && CURRENCIES.some((c) => c.code === s)) setCurrencyState(s);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      /* ignore */
    }
  }, [currency, ready]);

  // Rates are only needed once a non-THB currency is chosen · THB pages never fetch.
  useEffect(() => {
    if (currency === "THB" || table.source === "live") return;
    let cancelled = false;
    void loadRates().then((t) => {
      if (!cancelled) setTable(t);
    });
    return () => {
      cancelled = true;
    };
  }, [currency, table.source]);

  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);
  const rate = currency === "THB" ? 1 : table.rates[currency] ?? FALLBACK_RATES[currency];

  const format = useCallback(
    (amountThb: number) => formatMoney(convert(amountThb, currency, table.rates), currency),
    [currency, table]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, format, rate, rates: table, rateSource: table.source }),
    [currency, setCurrency, format, rate, table]
  );

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency outside CurrencyProvider");
  return ctx;
}
