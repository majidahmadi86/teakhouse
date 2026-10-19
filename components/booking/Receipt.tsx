"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RateBreakdown } from "@/components/booking/RateBreakdown";
import { qrMockSvg } from "@/lib/bookingUtils";
import { useCurrency } from "@/lib/currency";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";
import type { RateLine } from "@/lib/pricing";
import type { Room } from "@/lib/rooms";
import { formatBaht } from "@/lib/utils";
import { formatDay, formatTime } from "@/lib/i18n-core";

export type ReceiptProps = {
  code: string;
  bookingId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: string;
  checkIn: Date;
  checkOut: Date;
  room: Room;
  nights: number;
  rate: number;
  subtotal: number;
  deposit: number;
  balance: number;
  /** One line per price band of the stay · the per-night breakdown. */
  rateLines?: RateLine[];
  issuedAt?: Date;
  /** v18 · Settings → deposit share, shown in the deposit label. */
  depositPct?: number;
  /** v18 · an /offers rule applied to the stay. */
  offerLine?: { label: string; amount: number } | null;
};

export function Receipt({
  code,
  bookingId,
  guestName,
  guestEmail,
  guestPhone,
  guests,
  checkIn,
  checkOut,
  room,
  nights,
  rate,
  subtotal,
  deposit,
  balance,
  rateLines = [],
  issuedAt = new Date(),
  depositPct = 30,
  offerLine = null,
}: ReceiptProps) {
  const { t, tr, lang } = useI18n();
  const { format, currency } = useCurrency();
  const { user } = useGuestAuth();

  function handlePrint() {
    window.print();
  }

  const signupHref = bookingId
    ? `/account/signup?booking=${encodeURIComponent(bookingId)}&next=/account`
    : "/account/signup";

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div
        id="tkh-receipt"
        className="overflow-hidden rounded-card border border-line/80 bg-white shadow-soft print:shadow-none"
      >
        <header className="border-b border-line bg-ivory/60 px-6 py-8 sm:px-8">
          <Logo showTag={false} size={26} />
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.2em] text-teak">
            {t("bk.done")}
          </p>
          <h2 className="mt-2 text-[clamp(1.8rem,3vw,2.4rem)]">{t("bk.thanks")}</h2>
          <p className="mt-3 text-[15px] text-ink/80">
            {t("bk.receipt")} · <span className="font-semibold tracking-wide text-ink">{code}</span>
          </p>
        </header>

        <div className="space-y-6 px-6 py-8 text-[15px] sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                {t("col.guest")}
              </div>
              <div className="mt-1 font-medium text-ink">{guestName}</div>
              <div className="mt-0.5 text-sub">{guestEmail}</div>
              <div className="text-sub">{guestPhone}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                {t("avail.guests")}
              </div>
              <div className="mt-1 font-medium text-ink">{t(`g${guests}` as "g1")}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                {t("avail.in")}
              </div>
              <div className="mt-1 font-medium text-ink">
                {formatDay(lang, checkIn, { year: true })} · {formatTime(lang, "14:00")}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                {t("avail.out")}
              </div>
              <div className="mt-1 font-medium text-ink">
                {formatDay(lang, checkOut, { year: true })} · {formatTime(lang, "12:00")}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                {t("col.room")}
              </div>
              <div className="mt-1 font-medium text-ink">{tr(room.name)}</div>
              <div className="text-sub">{tr(room.meta)}</div>
            </div>
          </div>

          <div className="space-y-2 border-t border-line pt-4">
            {rateLines.length > 0 ? (
              <>
                <RateBreakdown
                  lines={rateLines}
                  showLabels={rateLines.length > 1}
                />
                {offerLine ? (
                  <div className="flex justify-between text-forest">
                    <span>{offerLine.label}</span>
                    <span>-{format(offerLine.amount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-line pt-2 font-medium text-ink">
                  <span>{t("bk.stayTotal")}</span>
                  <span>{format(subtotal)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-sub">
                  {format(rate)} × {nights}{" "}
                  {nights === 1 ? t("bk.night") : t("bk.nights")}
                </span>
                <span className="font-medium text-ink">{format(subtotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-ink">
              <span>{t("bk.dep", { pct: depositPct })}</span>
              <span>{format(deposit)}</span>
            </div>
            <div className="flex justify-between text-sub">
              <span>{t("bk.bal")}</span>
              <span>{format(balance)}</span>
            </div>
            {currency !== "THB" ? (
              <div className="flex justify-between text-sub">
                <span>{t("cur.chargedThb")}</span>
                <span>{formatBaht(subtotal)}</span>
              </div>
            ) : (
              <p className="text-[0.78rem] font-semibold text-sub">
                {t("cur.chargedThb")}
              </p>
            )}
          </div>

          <div className="rounded-soft bg-forest-soft px-4 py-3 text-[14px] font-medium text-forest">
            {t("trust.2")}
          </div>

          <footer className="flex flex-col items-center gap-4 border-t border-line pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                {t("bk.receipt")}
              </div>
              <div className="mt-1 text-[0.82rem] font-semibold text-sub">
                {formatDay(lang, issuedAt, { year: true })}
              </div>
              <p className="mt-2 max-w-xs text-[0.85rem] font-medium text-ink">
                {t("bk.showCheckin")}
              </p>
            </div>
            <div className="shrink-0 rounded-lg border border-line bg-white p-3">
              <svg
                width="100"
                height="100"
                viewBox="0 0 21 21"
                shapeRendering="crispEdges"
                aria-label={code}
                dangerouslySetInnerHTML={{ __html: qrMockSvg() }}
              />
            </div>
          </footer>
        </div>
      </div>

      {!user ? (
        <div className="mt-4 rounded-card border border-line bg-white px-5 py-4 text-center print:hidden">
          <Link
            href={signupHref}
            className="text-[15px] font-medium text-forest underline underline-offset-4"
          >
            {t("acc.createForBooking")}
          </Link>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="btn-primary"
        >
          {t("bk.print")}
        </button>
        <Link
          href="/"
          className="btn-secondary"
        >
          {t("bk.back")}
        </Link>
      </div>
    </div>
  );
}
