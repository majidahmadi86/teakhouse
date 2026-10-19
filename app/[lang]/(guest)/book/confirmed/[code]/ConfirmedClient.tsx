"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import { OFFER_NUMBER, type OfferId } from "@/lib/offers";
import type { RateLine } from "@/lib/pricing";
import { catalogueRoom, type Room } from "@/lib/rooms";
import { daysBetweenIso } from "@/lib/stayDate";

/**
 * The receipt follows the guest's display currency (a browser setting), so it
 * renders in the browser; the server HTML carries the heading and the code,
 * which is all a reload needs to show at once.
 */
const Receipt = dynamic(() => import("@/components/booking/Receipt").then((m) => m.Receipt), {
  ssr: false,
  loading: () => null,
});

export default function ConfirmedClient({
  code,
  bookingId,
  guestName,
  guestEmail,
  guestPhone,
  guests,
  checkIn,
  checkOut,
  room,
  roomSlug,
  amount,
  deposit,
  depositPct,
  rateLines,
  offer,
  issuedAt,
  cancelled,
}: {
  code: string;
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  checkIn: string;
  checkOut: string;
  room: Room | null;
  roomSlug: string;
  amount: number;
  deposit: number;
  depositPct: number;
  rateLines: RateLine[];
  offer: { id: OfferId; amount: number } | null;
  issuedAt: string;
  cancelled: boolean;
}) {
  const { t } = useI18n();
  const catalogue = catalogueRoom(roomSlug);
  // The receipt reads the room's name and one-line summary · the guest
  // site's catalogue words when the room is in it (as /book showed them),
  // otherwise the owner's own words from the database.
  const receiptRoom: Room | null = room
    ? catalogue
      ? { ...room, name: catalogue.name, meta: catalogue.summary }
      : room
    : null;
  const nights = Math.max(1, daysBetweenIso(checkIn, checkOut));

  return (
    <div className="mx-auto w-full max-w-[640px]">
      {cancelled ? (
        <p
          role="status"
          className="mb-5 rounded-card border border-coral-deep/40 bg-white px-4 py-3.5 text-[14.5px] text-coral-deep"
        >
          {t("bk.confCancelled")}
        </p>
      ) : null}
      {receiptRoom ? (
        <Receipt
          code={code}
          bookingId={bookingId}
          guestName={guestName}
          guestEmail={guestEmail}
          guestPhone={guestPhone}
          guests={String(Math.min(guests, 4))}
          checkIn={new Date(checkIn + "T12:00:00")}
          checkOut={new Date(checkOut + "T12:00:00")}
          room={receiptRoom}
          nights={nights}
          rate={Math.round(amount / nights)}
          subtotal={amount}
          deposit={deposit}
          balance={amount - deposit}
          rateLines={rateLines}
          issuedAt={new Date(issuedAt)}
          depositPct={depositPct}
          offerLine={offer ? { label: t(`off.${OFFER_NUMBER[offer.id]}.title`), amount: offer.amount } : null}
        />
      ) : null}
      <noscript>
        <p className="text-center text-[15px] text-ink/80">
          {t("bk.receipt")} · {code}
        </p>
      </noscript>
    </div>
  );
}
