"use client";

import { useCurrency } from "@/lib/currency";

/**
 * A price in the guest's chosen currency · the smallest possible island.
 *
 * The server (and a static page) renders THB; once scripts run, the shared
 * currency store (lib/currency.ts) re-renders it in the guest's currency at
 * live rates, and every <Price> on the page follows the header's currency
 * select at once. Amounts are always passed in THB.
 */
export function Price({ thb, className }: { thb: number; className?: string }) {
  const { format } = useCurrency();
  return (
    <span className={className} data-price>
      {format(thb)}
    </span>
  );
}
