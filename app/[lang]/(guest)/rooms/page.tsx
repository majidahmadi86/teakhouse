import Link from "next/link";
import { Check } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Price } from "@/components/Price";
import { RoomCard } from "@/components/rooms/RoomCard";
import { ROOM_CATALOGUE } from "@/lib/rooms";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";

const INCLUDED = ["rp.i1", "rp.i2", "rp.i3", "rp.i4", "rp.i5", "rp.i6"] as const;

/**
 * /rooms · server HTML from the catalogue: the six rooms and suites with
 * their own covers, a calm comparison table (#compare), and what every
 * direct stay includes. No client bundle beyond the <Price> islands.
 */
export default function RoomsPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const rooms = ROOM_CATALOGUE;

  return (
    <>
      <PageHero
        imageId="hero-rooms"
        phoneImageId="hero-rooms-m"
        alt={t(locale, "rp.heroAlt")}
        eyebrow={t(locale, "rooms.eyebrow")}
        title={t(locale, "rp.h1")}
        lead={t(locale, "rp.lead")}
      />

      <section className="bg-stone px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-site gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.slug}
              room={room}
              locale={locale}
              sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 400px"
            />
          ))}
        </div>
      </section>

      <section id="compare" className="scroll-mt-28 border-t border-line bg-white px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-site">
          <p className="eyebrow">{t(locale, "rooms.compareEyebrow")}</p>
          <h2 className="mt-4">{t(locale, "rooms.compare")}</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-start text-[15px]">
              <thead>
                <tr className="border-b border-line text-[12px] font-semibold uppercase tracking-[0.14em] text-sub">
                  <th scope="col" className="py-3 pe-4 text-start font-semibold">{t(locale, "col.room")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">{t(locale, "room.size")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">{t(locale, "room.beds")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">{t(locale, "room.view")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-semibold">{t(locale, "room.sleepsShort")}</th>
                  <th scope="col" className="py-3 ps-4 text-end font-semibold">{t(locale, "room.fromNight")}</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.slug} className="border-b border-line">
                    <th scope="row" className="py-4 pe-4 text-start font-normal">
                      <Link href={`/rooms/${room.slug}`} prefetch={false} className="font-display text-[19px] text-ink hover:text-forest">
                        {tr(locale, room.name)}
                      </Link>
                    </th>
                    <td className="px-4 py-4 text-ink/80">{room.sizeM2} m²</td>
                    <td className="px-4 py-4 text-ink/80">{tr(locale, room.beds)}</td>
                    <td className="px-4 py-4 text-ink/80">{tr(locale, room.view)}</td>
                    <td className="px-4 py-4 text-ink/80">{room.capacity}</td>
                    <td className="py-4 ps-4 text-end font-medium text-ink">
                      <Price thb={room.rate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-ivory px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-site gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow">{t(locale, "off.eyebrow")}</p>
            <h2 className="mt-4">{t(locale, "rp.inc")}</h2>
            <Link href="/book" prefetch={false} className="btn-primary mt-8">
              {t(locale, "nav.book")}
            </Link>
          </div>
          <ul className="grid gap-x-10 border-t border-line sm:grid-cols-2">
            {INCLUDED.map((key) => (
              <li key={key} className="flex gap-3 border-b border-line py-5 text-[16px] text-ink">
                <Check className="mt-1 h-4 w-4 shrink-0 text-forest" aria-hidden />
                {t(locale, key)}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
