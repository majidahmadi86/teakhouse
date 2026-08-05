"use client";

import { useI18n } from "@/lib/i18n";
import { formatBaht } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PriceChipProps = {
  rate: number;
  ota: number;
  variant?: "default" | "brass";
  className?: string;
  showSave?: boolean;
};

export function PriceChip({
  rate,
  ota,
  variant = "default",
  className,
  showSave = false,
}: PriceChipProps) {
  const { t } = useI18n();
  const save = ota - rate;

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-white",
        variant === "brass" ? "bg-gold" : "bg-brand",
        className
      )}
    >
      <span>{t("chip.direct")}</span>
      <span>{formatBaht(rate)}</span>
      <s className="font-semibold opacity-55">{formatBaht(ota)}</s>
      <span className="text-[0.68rem] font-semibold opacity-70">{t("chip.via")}</span>
      {showSave && save > 0 ? (
        <span className="rounded-full bg-deal-bg px-2 py-0.5 text-[0.65rem] font-bold text-deal">
          {t("chip.save", { z: save.toLocaleString("en-US") })}
        </span>
      ) : null}
    </span>
  );
}
