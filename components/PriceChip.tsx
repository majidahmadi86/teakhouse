"use client";

import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PriceChipProps = {
  rate: number;
  ota: number;
  urgency?: { en: string; th: string };
  className?: string;
  compact?: boolean;
  showSave?: boolean;
};

export function PriceChip({
  rate,
  ota,
  urgency,
  className,
  compact,
  showSave = true,
}: PriceChipProps) {
  const { t, tr } = useI18n();
  const { format } = useCurrency();
  const save = ota - rate;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="min-h-[1.5rem]">
        {urgency ? <span className="urgency-chip">{tr(urgency)}</span> : null}
      </div>
      <div
        className={cn(
          "inline-flex min-h-[34px] flex-wrap items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 shadow-card",
          compact && "min-h-[30px] px-2.5 py-1"
        )}
      >
        <span className="text-sm font-bold text-blue">
          {t("chip.direct")} {format(rate)}
        </span>
        <span className="text-xs text-strike line-through">{format(ota)}</span>
        {showSave && save > 0 ? (
          <span className="rounded-full bg-deal-bg px-2 py-0.5 text-[0.68rem] font-bold text-deal">
            {t("chip.save", { z: format(save) })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
