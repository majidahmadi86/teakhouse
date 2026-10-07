"use client";

import React, { useCallback, useMemo, useSyncExternalStore } from "react";
import { hotelConfig } from "@/config/hotel.config";
import {
  CURRENCY_CATALOGUE,
  FALLBACK_RATES,
  FALLBACK_TABLE,
  convertFromThb as convert,
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
  type RateTable,
} from "@/lib/currencies";

/**
 * Thirteen currencies at live ECB rates (ported from v15/v16 lib/currency.ts),
 * held in ONE module-level store instead of a React provider.
 *
 * THB is the base; every other currency is a display conversion. Any island
 * on any page (the header's currency select, a <Price>, the /book flow) reads
 * and writes the same store, so a static page needs no provider around it and
 * every price on screen follows a change at once.
 *
 * The server always renders THB (getServerSnapshot). On the client the store
 * starts from the guest's saved choice; React re-renders after hydration when
 * that differs, so there is never a hydration mismatch. Live rates load from
 * /api/fx only once a non-THB currency is chosen · a THB page never fetches.
 */

export type Currency = CurrencyCode;

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] =
  hotelConfig.currencies
    .filter(isCurrencyCode)
    .map((code) => ({
      code,
      symbol: CURRENCY_CATALOGUE[code].symbol,
      label: CURRENCY_CATALOGUE[code].label,
    }));

export const STORAGE_KEY = "tkh-cur";

/** Static conversion · kept for server-free callers (uses the offline table). */
export function convertFromThb(amountThb: number, currency: Currency): number {
  return convert(amountThb, currency, FALLBACK_RATES);
}

/** Guest-facing price with the offline table · THB keeps ฿2,400. */
export function formatPrice(amountThb: number, currency: Currency): string {
  return formatMoney(convert(amountThb, currency, FALLBACK_RATES), currency);
}

/* ── The store ───────────────────────────────────────────────────────────── */

type State = { currency: Currency; table: RateTable };

const SERVER_STATE: State = { currency: "THB", table: FALLBACK_TABLE };
let state: State = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function isOffered(c: unknown): c is Currency {
  return isCurrencyCode(c) && CURRENCIES.some((x) => x.code === c);
}

let inflight: Promise<RateTable> | null = null;

function loadRates() {
  if (state.table.source === "live" || inflight) return;
  inflight = fetch("/api/fx")
    .then(async (r) => {
      if (!r.ok) throw new Error(String(r.status));
      const t = (await r.json()) as RateTable;
      if (!t?.rates?.USD) throw new Error("bad table");
      return { ...t, rates: { ...FALLBACK_RATES, ...t.rates } } as RateTable;
    })
    .catch(() => FALLBACK_TABLE);
  void inflight.then((table) => {
    inflight = null;
    if (table.source === "live") {
      state = { ...state, table };
      emit();
    }
  });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isOffered(saved) && saved !== state.currency) state = { ...state, currency: saved };
  } catch {
    /* storage blocked · stay on THB */
  }
  // Another tab changed it.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && isOffered(e.newValue) && e.newValue !== state.currency) {
      state = { ...state, currency: e.newValue };
      if (state.currency !== "THB") loadRates();
      emit();
    }
  });
  if (state.currency !== "THB") loadRates();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    start();
    // The saved choice may differ from the server's THB · tell React.
    if (state !== SERVER_STATE) queueMicrotask(emit);
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_STATE;

/** Set the display currency for every island on the page (and remember it). */
export function setCurrency(c: Currency) {
  if (!isOffered(c) || c === state.currency) return;
  state = { ...state, currency: c };
  try {
    localStorage.setItem(STORAGE_KEY, c);
  } catch {
    /* ignore */
  }
  if (c !== "THB") loadRates();
  emit();
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

export function useCurrency(): CurrencyCtx {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useCallback((c: Currency) => setCurrency(c), []);
  const format = useCallback(
    (amountThb: number) => formatMoney(convert(amountThb, s.currency, s.table.rates), s.currency),
    [s]
  );
  const rate = s.currency === "THB" ? 1 : s.table.rates[s.currency] ?? FALLBACK_RATES[s.currency];
  return useMemo(
    () => ({
      currency: s.currency,
      setCurrency: set,
      format,
      rate,
      rates: s.table,
      rateSource: s.table.source,
    }),
    [s, set, format, rate]
  );
}

/**
 * Kept for the trees that already wrap themselves in it (the owner panel,
 * /book, /account) · the store needs no provider, so this is a pass-through.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}
