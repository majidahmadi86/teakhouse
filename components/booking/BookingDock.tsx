"use client";

import { useState } from "react";
import { ChevronUp, ShieldCheck } from "lucide-react";
import { RateBreakdown } from "@/components/booking/RateBreakdown";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { formatDay, formatTime, nightsLabel } from "@/lib/i18n-core";
import type { RateLine } from "@/lib/pricing";
import type { BookableRoom } from "@/lib/liveRooms";
import { cn } from "@/lib/utils";

export type DockAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/**
 * The booking dock · the ONE always-visible summary of the stay and its next
 * step on /book (v17 A4). One element at every width, never two:
 *
 * - from 1024 px it is a sticky side card beside the flow: room, dates,
 *   nights, guests, the nightly breakdown, total, deposit today, balance at
 *   the hotel, and the primary action;
 * - below that it is a bar fixed to the bottom of the screen with the total
 *   (or what is missing) and the same primary action, and a Details toggle
 *   that opens the full summary above it.
 *
 * So the next step is never below the fold, and nothing else on the page is
 * sticky. The concierge button sits above it (app/globals.css) and never
 * covers it.
 */
export function BookingDock({
  room,
  checkIn,
  checkOut,
  guests,
  nights,
  subtotal,
  deposit,
  balance,
  savings,
  rateLines,
  depositPct = 30,
  offerLine = null,
  priced,
  action,
  hint,
}: {
  room: BookableRoom | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  subtotal: number;
  deposit: number;
  balance: number;
  savings: number;
  rateLines: RateLine[];
  /** v18 · Settings → deposit share, shown in the deposit label. */
  depositPct?: number;
  /** v18 · an /offers rule applied to the stay (label + what it takes off). */
  offerLine?: { label: string; amount: number } | null;
  /** False until live rates are in, so no total is shown that would change. */
  priced: boolean;
  action: DockAction;
  /** What the guest still has to do, when the action is not ready. */
  hint?: string;
}) {
  const { t, tr, lang } = useI18n();
  const { format } = useCurrency();
  const [open, setOpen] = useState(false);
  const stayLine = `${formatDay(lang, checkIn)} → ${formatDay(lang, checkOut)}`;
  const nightsText = nightsLabel(lang, nights);
  const guestsText = t(`g${guests}` as "g1");
  const showTotal = Boolean(room && priced && subtotal > 0);

  return (
    <aside
      data-booking-dock
      aria-label={t("bk.summary")}
      className={cn(
        "z-sticky print:hidden",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:border-t max-lg:border-line max-lg:bg-white max-lg:shadow-dock",
        "lg:sticky lg:top-[calc(var(--demo-bar-h)+var(--header-h)+1.5rem)] lg:self-start"
      )}
    >
      <div
        className={cn(
          "lg:flex lg:max-h-[calc(100vh-var(--demo-bar-h)-var(--header-h)-3rem)] lg:flex-col lg:overflow-hidden lg:rounded-card lg:border lg:border-line/80 lg:bg-white lg:shadow-soft",
          "max-lg:max-h-[70vh] max-lg:overflow-y-auto"
        )}
      >
        {/* The full summary · always on desktop, on demand on phones. */}
        <div className={cn("px-5 pt-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-7 lg:pb-4 lg:pt-6", open ? "max-lg:block max-lg:border-b max-lg:border-line max-lg:pb-4" : "max-lg:hidden")}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-teak">{t("bk.summary")}</p>
          <p className="mt-2 font-display text-[22px] leading-snug text-ink" data-dock-room>
            {room ? tr(room.name) : t("bk.noRoomYet")}
          </p>
          {room ? <p className="mt-1 text-[14px] text-sub">{tr(room.summary)}</p> : null}

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[14.5px]">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">{t("avail.in")}</dt>
              <dd className="mt-1 font-medium text-ink">{formatDay(lang, checkIn)}</dd>
              <dd className="text-[13px] text-sub">{t("bk.fromTime", { time: formatTime(lang, "14:00") })}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">{t("avail.out")}</dt>
              <dd className="mt-1 font-medium text-ink">{formatDay(lang, checkOut)}</dd>
              <dd className="text-[13px] text-sub">{t("bk.untilTime", { time: formatTime(lang, "12:00") })}</dd>
            </div>
            <div className="col-span-2 flex items-center justify-between text-ink">
              <span data-dock-nights>{nightsText}</span>
              <span className="text-sub">{guestsText}</span>
            </div>
          </dl>

          {showTotal ? (
            <div className="mt-4 border-t border-line pt-4 text-[14.5px]">
              <RateBreakdown lines={rateLines} />
              {offerLine ? (
                <p className="mt-3 flex justify-between gap-3 text-forest" data-dock-offer>
                  <span>{offerLine.label}</span>
                  <span className="font-medium">-{format(offerLine.amount)}</span>
                </p>
              ) : null}
              {savings > 0 ? (
                <p className="mt-3 flex justify-between gap-3 text-deal">
                  <span>{t("bk.save")}</span>
                  <span className="font-medium">-{format(savings)}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* The total and the action · the part that is always on screen. */}
        <div className="px-4 py-3 lg:shrink-0 lg:px-7 lg:pb-6 lg:pt-0">
          <div className={cn("lg:border-t lg:border-line lg:pt-4", !showTotal && "lg:pt-0")}>
            {showTotal ? (
              <div className="hidden lg:block">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium text-ink">{t("bk.total")}</span>
                  <span className="font-display text-[28px] text-ink" data-dock-total>
                    {format(subtotal)}
                  </span>
                </p>
                <p className="mt-1 text-[12.5px] text-sub">{t("bk.taxes")}</p>
                <p className="mt-3 flex justify-between gap-3 text-[14.5px] font-medium text-ink">
                  <span>{t("bk.dep", { pct: depositPct })}</span>
                  <span data-dock-deposit>{format(deposit)}</span>
                </p>
                <p className="mt-1 flex justify-between gap-3 text-[14px] text-sub">
                  <span>{t("bk.bal")}</span>
                  <span>{format(balance)}</span>
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-3 lg:mt-4 lg:block">
              {/* Phones: what the stay comes to, or what is still missing. */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-2 text-start lg:hidden"
              >
                <span className="min-w-0 flex-1">
                  {showTotal ? (
                    <>
                      <span className="block text-[12.5px] leading-snug text-sub">
                        {room ? tr(room.name) : ""} · {nightsText}
                      </span>
                      <span className="block whitespace-nowrap text-[18px] font-semibold leading-tight text-ink">
                        {format(subtotal)}
                        <span className="ms-1.5 text-[12.5px] font-normal text-sub">
                          {t("bk.depShort", { z: format(deposit) })}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-[12.5px] leading-snug text-sub">
                        {stayLine} · {nightsText}
                      </span>
                      <span className="block text-[15px] font-medium leading-snug text-ink">
                        {hint ?? (room ? tr(room.name) : t("bk.dockEmpty"))}
                      </span>
                    </>
                  )}
                </span>
                <ChevronUp className={cn("h-4 w-4 shrink-0 text-sub transition", !open && "rotate-180")} aria-hidden />
                <span className="sr-only">{open ? t("bk.hideDetails") : t("bk.showDetails")}</span>
              </button>

              <button
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                data-dock-action
                className="btn-primary h-12 shrink-0 whitespace-nowrap px-5 text-[15px] lg:h-[54px] lg:w-full lg:text-[16px]"
              >
                {action.label}
              </button>
            </div>

            {hint && !action.disabled ? null : hint ? (
              <p className="mt-3 hidden text-center text-[13.5px] text-sub lg:block">{hint}</p>
            ) : null}
            <p className="mt-3 hidden items-center justify-center gap-2 text-[13px] text-sub lg:flex">
              <ShieldCheck className="h-4 w-4 text-forest" aria-hidden />
              {t("bk.cancel")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
