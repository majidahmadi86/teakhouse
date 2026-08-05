"use client";

import { useI18n } from "@/lib/i18n";
import { cn, formatBaht } from "@/lib/utils";

type PriceChipProps = {
  rate: number;
  ota: number;
  className?: string;
  showSave?: boolean;
  urgency?: { en: string; th: string };
};

export function PriceChip({
  rate,
  ota,
  className,
  showSave = false,
  urgency,
}: PriceChipProps) {
  const { t, tr } = useI18n();
  const save = ota - rate;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold shadow-sm">
        <span className="text-blue">
          {t("chip.direct")} {formatBaht(rate)}
        </span>
        <s className="font-semibold text-strike">{formatBaht(ota)}</s>
        <span className="text-[0.68rem] font-semibold text-strike">{t("chip.via")}</span>
        {showSave && save > 0 ? (
          <span className="rounded-full bg-deal-bg px-2 py-0.5 text-[0.65rem] font-bold text-deal">
            {t("chip.save", { z: save.toLocaleString("en-US") })}
          </span>
        ) : null}
      </span>
      {urgency ? (
        <span className="inline-flex items-center rounded-full bg-orange/10 px-2.5 py-1 text-[0.65rem] font-bold text-orange">
          {tr(urgency)}
        </span>
      ) : null}
    </span>
  );
}
