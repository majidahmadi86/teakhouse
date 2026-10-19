import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifyBookingToken } from "@/lib/bookingToken";
import { roomToClient } from "@/lib/mappers";
import { OFFER_IDS, type OfferId } from "@/lib/offers";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { groupNights, quoteStay, toPriceRule } from "@/lib/pricing";
import { t } from "@/lib/serverLocale";
import ConfirmedClient from "./ConfirmedClient";

/**
 * v18 · /book/confirmed/<code>?t=<token> · the booking confirmation as its
 * own address, so a reload, a bookmark or the link in the confirmation email
 * opens it again.
 *
 * Never by code alone: the token (lib/bookingToken) is an HMAC of the booking
 * id and the guest's email, handed only to the browser that made the booking
 * and to the guest's inbox. A wrong or missing token shows the same polite
 * page as an unknown code, so the page cannot be used to test codes.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const OFFER_NOTE: Record<OfferId, string> = {
  early: "Offer: Early booking",
  longer: "Offer: Stay longer",
  arrival: "Offer: Private arrival",
};

export default async function ConfirmedPage({
  params,
  searchParams,
}: {
  params: LangParams & { code: string };
  searchParams: { t?: string | string[] };
}) {
  const lang = pageLang(params);
  const code = decodeURIComponent(params.code ?? "").slice(0, 40);
  const token = typeof searchParams.t === "string" ? searchParams.t : null;

  const booking = code
    ? await prisma.booking.findUnique({ where: { code } }).catch(() => null)
    : null;
  const valid = Boolean(
    booking && booking.email && verifyBookingToken(booking.id, booking.email, token)
  );

  if (!booking || !valid) {
    return (
      <section className="px-4 pb-24 pt-10 sm:px-8">
        <div className="mx-auto max-w-[640px] rounded-card border border-line/80 bg-white px-6 py-10 text-center shadow-soft sm:px-10">
          <h1 className="text-[clamp(1.7rem,3vw,2.2rem)]">{t(lang, "bk.confMissingH")}</h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink/80">{t(lang, "bk.confMissing")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/account" className="btn-primary">
              {t(lang, "acc.myBookings")}
            </Link>
            <Link href="/contact" className="btn-secondary">
              {t(lang, "nav.contact")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const [roomRow, hotel, rules] = await Promise.all([
    prisma.room.findUnique({ where: { slug: booking.roomSlug } }),
    prisma.hotel.findUnique({ where: { id: "default" }, select: { depositPct: true } }),
    prisma.seasonalPriceRule.findMany({ where: { room: { slug: booking.roomSlug } } }),
  ]);
  const room = roomRow ? roomToClient(roomRow) : null;
  const depositPct = Math.min(100, Math.max(0, hotel?.depositPct ?? 30));
  const deposit = Math.round((booking.amount * depositPct) / 100);
  const quote = room ? quoteStay(room.rate, booking.checkIn, booking.checkOut, rules.map(toPriceRule)) : null;

  // The nightly breakdown is shown when it adds up to what was charged, or
  // when an offer explains the difference.
  const offer = OFFER_IDS.find((id) => booking.notes.includes(OFFER_NOTE[id])) ?? null;
  const offerAmount = quote && offer ? Math.max(0, quote.total - booking.amount) : 0;
  const rateLines =
    quote && (quote.total === booking.amount || (offer && offerAmount > 0)) ? groupNights(quote.nights) : [];

  return (
    <section className="px-4 pb-24 pt-6 sm:px-8 md:pt-8 print:pt-4">
      <div className="mx-auto max-w-site">
        <ConfirmedClient
          code={booking.code}
          bookingId={booking.id}
          guestName={booking.guest}
          guestEmail={booking.email}
          guestPhone={booking.phone}
          guests={Math.max(1, (booking.adults ?? 0) + (booking.children ?? 0))}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          room={room}
          roomSlug={booking.roomSlug}
          amount={booking.amount}
          deposit={deposit}
          depositPct={depositPct}
          rateLines={rateLines}
          offer={offer && offerAmount > 0 ? { id: offer, amount: offerAmount } : null}
          issuedAt={booking.createdAt.toISOString()}
          cancelled={booking.status === "cancelled"}
        />
      </div>
    </section>
  );
}
