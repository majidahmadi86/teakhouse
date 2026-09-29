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

export type Currency = "THB" | "USD" | "EUR";

export const CURRENCIES: {
  code: Currency;
  symbol: string;
  label: string;
}[] = (
  [
    { code: "THB", symbol: "฿", label: "฿ THB" },
    { code: "USD", symbol: "$", label: "$ USD" },
    { code: "EUR", symbol: "€", label: "€ EUR" },
  ] as const
).filter((c) => hotelConfig.currencies.includes(c.code));



const STORAGE_KEY = "tkh-cur";

/** Demo rates: USD = THB/36, EUR = THB/39 */
export function convertFromThb(amountThb: number, currency: Currency): number {
  if (currency === "USD") return amountThb / 36;
  if (currency === "EUR") return amountThb / 39;
  return amountThb;
}

/** Guest-facing price. THB keeps ฿2,400; USD/EUR whole numbers ($108, €100). */
export function formatPrice(amountThb: number, currency: Currency): string {
  const converted = convertFromThb(amountThb, currency);
  if (currency === "THB") {
    return "฿" + Math.round(converted).toLocaleString("en-US");
  }
  const whole = Math.round(converted);
  const symbol = currency === "USD" ? "$" : "€";
  return symbol + whole.toLocaleString("en-US");
}

type CurrencyCtx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amountThb: number) => string;
};

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("THB");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "THB" || s === "USD" || s === "EUR") setCurrencyState(s);
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

  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);

  const format = useCallback(
    (amountThb: number) => formatPrice(amountThb, currency),
    [currency]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, format }),
    [currency, setCurrency, format]
  );

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency outside CurrencyProvider");
  return ctx;
}
