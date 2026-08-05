"use client";

import { useI18n } from "@/lib/i18n";
import { formatBaht } from "@/lib/utils";
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
  const save = ota - rate;

  return (
    <div className={cn("space-y-2", className)}>
      {urgency ? <span className="urgency-chip">{tr(urgency)}</span> : null}
      <div
        className={cn(
          "inline-flex flex-wrap items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 shadow-card",
          compact && "px-2.5 py-1"
        )}
      >
        <span className="text-sm font-bold text-blue">
          {t("chip.direct")} {formatBaht(rate)}
        </span>
        <span className="text-xs text-strike line-through">{formatBaht(ota)}</span>
        {showSave && save > 0 ? (
          <span className="rounded-full bg-deal-bg px-2 py-0.5 text-[0.68rem] font-bold text-deal">
            {t("chip.save").replace("{z}", String(save))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
