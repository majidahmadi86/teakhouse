import Link from "next/link";
import { CinematicLink } from "@/components/motion/CinematicLink";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { SEED_ROOMS } from "@/lib/rooms";
import { getServerLocale, t, tr } from "@/lib/serverLocale";
import { formatBaht } from "@/lib/utils";

const INCLUDED = ["rp.i1", "rp.i2", "rp.i3", "rp.i4", "rp.i5", "rp.i6"] as const;

/**
 * v15 · RSC rooms listing · editorial, no rooms-page client bundle.
 *
 * Each room is a spread: a large photograph and, beside it, the room's name in
 * Cormorant, its small-capitals facts, the description, and a quiet "from"
 * price in gold. Spreads alternate sides like a magazine. The photograph
 * carries a view-transition name so the click into the room glides.
 *
 * Every string resolves through the dictionary in the guest's language; room
 * names stay the property's own names.
 */
export default function RoomsPage() {
  const locale = getServerLocale();
  const rooms = SEED_ROOMS.filter((r) => r.active);

  return (
    <>
      <PageHero
        image="/hero-lcp-640.avif"
        imageAvif="/hero-lcp-640.avif"
        alt={t(locale, "rp.heroAlt")}
        eyebrow={t(locale, "rooms.eyebrow")}
        title={t(locale, "rp.h1")}
        lead={t(locale, "rp.lead")}
        objectPosition="center 40%"
      />

      <section className="bg-cloud px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1240px] space-y-20 md:space-y-28">
          {rooms.map((room, index) => {
            const flip = index % 2 === 1;
            return (
              <article
                key={room.id}
                className="grid items-center gap-8 md:grid-cols-12 md:gap-12"
                data-room-spread={room.slug}
              >
                <div className={flip ? "md:order-2 md:col-span-7" : "md:col-span-7"}>
                  <div
                    className="tkh-vt-room relative aspect-[4/3] overflow-hidden bg-line"
                    style={{ viewTransitionName: `room-${room.slug}` }}
                  >
                    <SafeImage
                      src={room.photos[0]}
                      alt={tr(locale, room.name)}
                      fill
                      sizes="(max-width: 768px) 100vw, 720px"
                      className="object-cover transition duration-[1400ms] ease-out hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <div className={flip ? "md:order-1 md:col-span-5 md:pr-6" : "md:col-span-5 md:pl-6"}>
                  <p className="luxe-caps text-gold">
                    {String(index + 1).padStart(2, "0")} · {tr(locale, room.floor)}
                  </p>
                  <h2 className="mt-4 font-display text-[2.4rem] leading-[1.05] text-ink md:text-[2.9rem]">
                    {tr(locale, room.name)}
                  </h2>
                  <span className="luxe-rule mt-5" aria-hidden />
                  <p className="luxe-caps mt-5 text-sub">
                    {room.sizeM2} m² · {tr(locale, room.bedType)} · {tr(locale, room.view)}
                  </p>
                  <p className="mt-5 max-w-prose text-[1.02rem] leading-relaxed text-ink/80">
                    {tr(locale, room.description)}
                  </p>
                  <p className="mt-6 font-display text-2xl text-ink">
                    <span className="luxe-caps mr-3 text-gold">{t(locale, "room.from")}</span>
                    {formatBaht(room.rate)}
                    <span className="ml-2 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-sub">
                      {t(locale, "room.night")}
                    </span>
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-6">
                    <CinematicLink
                      href={`/rooms/${room.slug}`}
                      prefetch={false}
                      className="link-draw luxe-caps text-ink"
                    >
                      {t(locale, "room.see")} →
                    </CinematicLink>
                    <Link href={`/book?room=${room.slug}`} prefetch={false} className="btn-primary">
                      {t(locale, "room.book")}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1240px]">
          <p className="eyebrow mb-4">{t(locale, "rooms.eyebrow")}</p>
          <h2>{t(locale, "rp.inc")}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((key, i) => (
              <article key={key} className="border-t border-line pt-5">
                <p className="luxe-caps text-gold">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-display text-xl text-ink">{t(locale, key)}</h3>
              </article>
            ))}
          </div>
          <p className="mt-14 text-center">
            <Link href="/book" prefetch={false} className="btn-primary">
              {t(locale, "nav.book")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
