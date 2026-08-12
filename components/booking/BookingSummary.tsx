"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { RateBreakdown } from "@/components/booking/RateBreakdown";
import { SafeImage } from "@/components/SafeImage";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import type { RateLine } from "@/lib/pricing";
import type { Room } from "@/lib/rooms";
import { isoDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type BookingSummaryProps = {
  checkIn: Date;
  checkOut?: Date;
  guests: string;
  room: Room | null;
  nights: number;
  rate: number;
  subtotal: number;
  savings: number;
  deposit: number;
  balance: number;
  /** One line per price band of the stay · empty for an unpriced stay. */
  rateLines?: RateLine[];
  /** Mobile collapsible bar */
  mobile?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function BookingSummary({
  checkIn,
  checkOut,
  guests,
  room,
  nights,
  rate,
  subtotal,
  savings,
  deposit,
  balance,
  rateLines = [],
  mobile = false,
  expanded = false,
  onToggle,
  className,
}: BookingSummaryProps) {
  const { t, tr } = useI18n();
  const { format } = useCurrency();
  const datesComplete = Boolean(checkOut);

  const body = (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
          {t("avail.dates")}
        </div>
        <div className="mt-1 font-semibold text-ink">
          {datesComplete ? (
            <>
              {isoDate(checkIn)} → {isoDate(checkOut!)}
            </>
          ) : (
            <>
              {isoDate(checkIn)} · {t("avail.selectDates")}
            </>
          )}
        </div>
        {datesComplete && nights > 0 ? (
          <div className="mt-0.5 text-sub">{t("bk.nightsCount", { n: nights })}</div>
        ) : null}
      </div>

      <div>
        <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
          {t("avail.guests")}
        </div>
        <div className="mt-1 font-semibold text-ink">{t(`g${guests}` as "g1")}</div>
      </div>

      {room ? (
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-lg">
            <SafeImage
              src={room.photos[0]}
              alt={tr(room.name)}
              fill
              quality={65}
              sizes="72px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold text-ink">
              {tr(room.name)}
            </div>
            <div className="text-[0.78rem] font-semibold text-sub">{tr(room.meta)}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-cloud px-3 py-2 text-[0.82rem] font-semibold text-sub">
          {t("bk.s2")}
        </div>
      )}

      {room && nights > 0 ? (
        <div className="space-y-2 border-t border-line pt-4">
          {rateLines.length > 0 ? (
            <>
              <RateBreakdown
                lines={rateLines}
                showLabels={rateLines.length > 1}
              />
              {rateLines.length > 1 ? (
                <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
                  <span>{t("bk.stayTotal")}</span>
                  <span>{format(subtotal)}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-sub">
                {format(rate)} × {nights}
              </span>
              <span className="font-semibold text-ink">{format(subtotal)}</span>
            </div>
          )}
          {savings > 0 ? (
            <div className="flex justify-between text-deal">
              <span>{t("bk.save")}</span>
              <span className="font-bold">-{format(savings)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
            <span>{t("bk.dep")}</span>
            <span>{format(deposit)}</span>
          </div>
          <div className="flex justify-between text-[0.82rem] text-sub">
            <span>{t("bk.bal")}</span>
            <span>{format(balance)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (mobile) {
    return (
      <div
        className={cn(
          "sticky top-[calc(3.5rem+var(--demo-bar-h))] z-sticky border-b border-line bg-white shadow-nav lg:hidden",
          className
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-blue">
              {t("bk.summary")}
            </div>
            <div className="truncate font-display text-lg font-semibold text-ink">
              {room && nights > 0 ? format(subtotal) : t("avail.selectDates")}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {deposit > 0 ? (
              <span className="text-[0.78rem] font-bold text-blue">
                {format(deposit)} {t("bk.dep").split("(")[0].trim()}
              </span>
            ) : null}
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-sub" aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5 text-sub" aria-hidden />
            )}
          </div>
        </button>
        {expanded ? <div className="border-t border-line px-4 pb-4">{body}</div> : null}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "hidden rounded-[14px] bg-white p-6 shadow-panel lg:sticky lg:top-24 lg:block",
        className
      )}
    >
      <h2 className="mb-5 font-display text-xl text-ink">{t("bk.summary")}</h2>
      {body}
    </aside>
  );
}
