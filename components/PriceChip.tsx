import { Price } from "@/components/Price";
import { t, tr } from "@/lib/serverLocale";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/locales/meta";

type PriceChipProps = {
  locale: Lang;
  rate: number;
  ota: number;
  urgency?: { en: string; th: string };
  className?: string;
  compact?: boolean;
  showSave?: boolean;
};

/**
 * Direct rate vs booking-site rate · server HTML. The three amounts are
 * <Price> islands, so the chip follows the guest's currency like every other
 * price (it used to be a whole client component for that).
 */
export function PriceChip({
  locale,
  rate,
  ota,
  urgency,
  className,
  compact,
  showSave = true,
}: PriceChipProps) {
  const save = ota - rate;
  const [saveBefore, saveAfter = ""] = t(locale, "chip.save").split("{z}");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="min-h-[1.5rem]">
        {urgency ? <span className="urgency-chip">{tr(locale, urgency)}</span> : null}
      </div>
      <div
        className={cn(
          "inline-flex min-h-[34px] flex-wrap items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 shadow-card",
          compact && "min-h-[30px] px-2.5 py-1"
        )}
      >
        <span className="text-sm font-bold text-blue">
          {t(locale, "chip.direct")} <Price thb={rate} />
        </span>
        <Price thb={ota} className="text-xs text-strike line-through" />
        {showSave && save > 0 ? (
          <span className="rounded-full bg-deal-bg px-2 py-0.5 text-[0.68rem] font-bold text-deal">
            {saveBefore}
            <Price thb={save} />
            {saveAfter}
          </span>
        ) : null}
      </div>
    </div>
  );
}
