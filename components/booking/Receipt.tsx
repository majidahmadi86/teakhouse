"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { qrMockSvg } from "@/lib/bookingUtils";
import { useCurrency } from "@/lib/currency";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";
import type { Room } from "@/lib/rooms";
import { formatBaht, isoDate } from "@/lib/utils";

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
  issuedAt?: Date;
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
  issuedAt = new Date(),
}: ReceiptProps) {
  const { t, tr } = useI18n();
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
        className="overflow-hidden rounded-[14px] bg-white shadow-panel print:shadow-none"
      >
        <header className="bg-navy px-6 py-8 text-white">
          <Logo light showTag={false} size={28} />
          <p className="mt-4 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-white/70">
            {t("bk.receipt")}
          </p>
          <div className="mt-2 font-display text-[1.75rem] font-semibold tracking-wide text-gold">
            {code}
          </div>
        </header>

        <div className="space-y-6 px-6 py-8 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
                {t("col.guest")}
              </div>
              <div className="mt-1 font-semibold text-ink">{guestName}</div>
              <div className="mt-0.5 text-sub">{guestEmail}</div>
              <div className="text-sub">{guestPhone}</div>
            </div>
            <div>
              <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
                {t("avail.guests")}
              </div>
              <div className="mt-1 font-semibold text-ink">{t(`g${guests}` as "g1")}</div>
            </div>
            <div>
              <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
                {t("avail.in")}
              </div>
              <div className="mt-1 font-semibold text-ink">
                {isoDate(checkIn)} · 14:00
              </div>
            </div>
            <div>
              <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
                {t("avail.out")}
              </div>
              <div className="mt-1 font-semibold text-ink">
                {isoDate(checkOut)} · 12:00
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
                {t("col.room")}
              </div>
              <div className="mt-1 font-semibold text-ink">{tr(room.name)}</div>
              <div className="text-sub">{tr(room.meta)}</div>
            </div>
          </div>

          <div className="space-y-2 border-t border-line pt-4">
            <div className="flex justify-between">
              <span className="text-sub">
                {format(rate)} × {nights} {nights > 1 ? t("bk.nights") : t("bk.night")}
              </span>
              <span className="font-semibold text-ink">{format(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink">
              <span>{t("bk.dep")}</span>
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

          <div className="rounded-lg bg-deal-bg px-4 py-3 text-[0.82rem] font-semibold text-deal">
            {t("trust.2")}
          </div>

          <footer className="flex flex-col items-center gap-4 border-t border-line pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sub">
                {t("bk.receipt")}
              </div>
              <div className="mt-1 text-[0.82rem] font-semibold text-sub">
                {isoDate(issuedAt)}
              </div>
              <p className="mt-2 max-w-xs text-[0.85rem] font-semibold text-ink">
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
        <div className="mt-4 rounded-[14px] border border-blue/20 bg-sky/40 px-5 py-4 text-center print:hidden">
          <Link
            href={signupHref}
            className="text-sm font-bold text-blue underline"
          >
            {t("acc.createForBooking")}
          </Link>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-full bg-blue px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-dark"
        >
          {t("bk.print")}
        </button>
        <Link
          href="/"
          className="inline-flex rounded-full border border-ink/25 px-7 py-3.5 text-sm font-bold text-ink hover:bg-cloud"
        >
          {t("bk.back")}
        </Link>
      </div>
    </div>
  );
}
