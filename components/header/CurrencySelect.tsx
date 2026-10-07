"use client";

import { ChevronDown } from "lucide-react";
import { CURRENCIES, useCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * Currency · a native select styled as the header's currency pill. It needs no
 * provider: it reads and writes the shared store in lib/currency.ts, so every
 * <Price> on the page follows. The static HTML says THB; a guest who chose
 * another currency sees it once scripts run (the same moment every price
 * converts), so the select and the prices never disagree.
 */
export function CurrencySelect({
  label,
  className,
  size = "sm",
}: {
  label: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const { currency, setCurrency } = useCurrency();

  return (
    <label
      className={cn(
        "icon-hit relative inline-flex items-center whitespace-nowrap rounded-full text-ink",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className={cn(
          "cursor-pointer appearance-none bg-transparent py-1.5 pl-2 pr-6 font-bold text-ink outline-none [field-sizing:content]",
          size === "lg" ? "text-[15px]" : "text-[13px]"
        )}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-sub"
        aria-hidden
      />
    </label>
  );
}
