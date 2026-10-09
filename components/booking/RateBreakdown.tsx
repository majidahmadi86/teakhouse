"use client";

import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { nightsLabel } from "@/lib/i18n-core";
import type { RateLine } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * What each night of the stay costs, adjacent same-price nights collapsed.
 * A flat stay renders exactly the one line it always did ("฿3,900 × 2 nights"),
 * so nothing shifts for the common case · a stay that crosses a season or a
 * date override renders one line per price band and says which rule set it.
 */
export function RateBreakdown({
  lines,
  className,
  showLabels = true,
}: {
  lines: RateLine[];
  className?: string;
  /** Show the rule name (High season, Songkran) next to a priced band. */
  showLabels?: boolean;
}) {
  const { lang } = useI18n();
  const { format } = useCurrency();

  if (lines.length === 0) return null;

  return (
    <ul className={cn("space-y-1.5", className)}>
      {lines.map((line) => (
        <li key={`${line.from}-${line.price}`} className="flex justify-between gap-3">
          {/* The rule badge sits under the price, not beside it · this list also
              renders in the 320px stay summary, where an inline badge collided
              with the amount on the right. */}
          <span className="min-w-0 text-sub">
            <span className="block whitespace-nowrap">
              {format(line.price)} × {nightsLabel(lang, line.nights)}
            </span>
            {showLabels && line.label ? (
              <span
                className={cn(
                  "mt-1 inline-block rounded-soft px-1.5 py-0.5 text-[11.5px] font-medium",
                  line.source === "override" ? "bg-ivory text-teak" : "bg-forest-soft text-forest"
                )}
              >
                {line.label}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 font-medium text-ink">
            {format(line.price * line.nights)}
          </span>
        </li>
      ))}
    </ul>
  );
}
