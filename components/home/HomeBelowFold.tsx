import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OfferCard } from "@/components/OfferCard";
import { Picture } from "@/components/Picture";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RiverMap } from "@/components/site/RiverMap";
import { Reveal, RevealItem, RevealStagger } from "@/components/home/HomeReveal";
import { FACILITIES } from "@/lib/facilities";
import { ROOM_CATALOGUE } from "@/lib/rooms";
import { translate as t, type Lang } from "@/lib/translate";

const OFFERS = ["1", "2", "3"] as const;

function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-[720px] text-center" : "max-w-[640px]"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4">{title}</h2>
      {lead ? <p className="lead mt-5">{lead}</p> : null}
    </div>
  );
}

/** One photograph and one idea, side by side · dining, celebrations. */
function Feature({
  locale,
  image,
  alt,
  eyebrow,
  title,
  body,
  href,
  cta,
  flip = false,
}: {
  locale: Lang;
  image: "dining-beyond" | "events-beyond";
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  flip?: boolean;
}) {
  void locale;
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <Reveal className={flip ? "md:order-2" : undefined}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory md:aspect-[5/4]">
          <Picture id={image} alt={alt} sizes="(max-width: 767px) calc(100vw - 40px), 50vw" fill unveil />
        </div>
      </Reveal>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4">{title}</h2>
        <p className="lead mt-5">{body}</p>
        <Link href={href} prefetch={false} className="link-quiet mt-8">
          {cta}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      </Reveal>
    </div>
  );
}

/**
 * Home below the fold · server HTML in the page's language, visible with no
 * script. Bright and generous: a welcome, the six rooms, dining and
 * celebrations with their own photographs, the hotel's services in words,
 * the offers, and the neighbourhood as a drawn map. No dark bands, no icon
 * rows, no stand-in photographs.
 */
export function HomeBelowFold({ locale }: { locale: Lang }) {
  return (
    <>
      {/* Welcome */}
      <section className="tkh-below-section section-pad bg-stone">
        <Reveal className="mx-auto max-w-[820px] text-center">
          <p className="eyebrow">{t(locale, "home.intro.eyebrow")}</p>
          <h2 className="mt-4">{t(locale, "home.intro.h2")}</h2>
          <p className="lead mx-auto mt-6 max-w-[62ch]">{t(locale, "home.intro.p")}</p>
        </Reveal>
        <RevealStagger className="mx-auto mt-14 grid max-w-[960px] gap-8 border-y border-line py-10 text-center sm:grid-cols-3">
          {(["1", "2", "3"] as const).map((n) => (
            <RevealItem key={n}>
              <p className="font-display text-[34px] leading-none text-teak">{t(locale, `home.fact${n}.n`)}</p>
              <p className="mt-3 text-[15px] text-ink/75">{t(locale, `home.fact${n}.p`)}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* Rooms and suites */}
      <section className="tkh-below-section section-pad bg-white">
        <div className="wrap !px-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              eyebrow={t(locale, "home.rooms.eyebrow")}
              title={t(locale, "home.rooms.h2")}
              lead={t(locale, "home.rooms.p")}
            />
            <Link href="/rooms" prefetch={false} className="btn-secondary">
              {t(locale, "rooms.all")}
            </Link>
          </div>
          <RevealStagger className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {ROOM_CATALOGUE.map((room) => (
              <RevealItem key={room.slug}>
                <RoomCard
                  room={room}
                  locale={locale}
                  sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 400px"
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Dining and celebrations */}
      <section className="tkh-below-section section-pad bg-stone">
        <div className="wrap !px-0 space-y-24 md:space-y-32">
          <Feature
            locale={locale}
            image="dining-beyond"
            alt={t(locale, "home.dining.alt")}
            eyebrow={t(locale, "home.dining.eyebrow")}
            title={t(locale, "home.dining.h2")}
            body={t(locale, "home.dining.p")}
            href="/dining"
            cta={t(locale, "home.dining.cta")}
          />
          <Feature
            locale={locale}
            image="events-beyond"
            alt={t(locale, "home.events.alt")}
            eyebrow={t(locale, "home.events.eyebrow")}
            title={t(locale, "home.events.h2")}
            body={t(locale, "home.events.p")}
            href="/events"
            cta={t(locale, "home.events.cta")}
            flip
          />
        </div>
      </section>

      {/* The hotel · services in words, each a door into /facilities */}
      <section className="tkh-below-section section-pad bg-ivory">
        <div className="wrap !px-0 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <SectionHead
              eyebrow={t(locale, "fac.strip.eyebrow")}
              title={t(locale, "fac.strip.h2")}
              lead={t(locale, "fac.strip.p")}
            />
            <Link href="/experience" prefetch={false} className="link-quiet mt-8">
              {t(locale, "home.exp.cta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Reveal>
          <RevealStagger className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
            {FACILITIES.map((f) => (
              <RevealItem key={f.key}>
                <Link
                  href="/facilities"
                  prefetch={false}
                  className="group flex h-full flex-col border-b border-line py-6 transition"
                >
                  <span className="flex items-center justify-between gap-3 font-display text-[21px] text-ink">
                    {t(locale, `${f.key}.h`)}
                    <ArrowRight className="h-4 w-4 shrink-0 text-teak transition group-hover:translate-x-1 rtl:rotate-180" aria-hidden />
                  </span>
                  <span className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(locale, `${f.key}.p`)}</span>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Offers */}
      <section className="tkh-below-section section-pad bg-white">
        <div className="wrap !px-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead eyebrow={t(locale, "off.eyebrow")} title={t(locale, "off.strip")} lead={t(locale, "off.lead")} />
            <Link href="/offers" prefetch={false} className="link-quiet">
              {t(locale, "off.seeAll")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <OfferCard n={n} locale={locale} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* The neighbourhood */}
      <section className="tkh-below-section section-pad bg-stone">
        <div className="wrap !px-0 grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <SectionHead
              eyebrow={t(locale, "home.loc.eyebrow")}
              title={t(locale, "home.loc.h2")}
              lead={t(locale, "home.loc.p")}
            />
            <Link href="/location" prefetch={false} className="link-quiet mt-8">
              {t(locale, "home.loc.cta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Reveal>
          <Reveal>
            <div className="overflow-hidden rounded-card border border-line/80 shadow-soft">
              <RiverMap
                labels={{
                  hotel: t(locale, "brand.name"),
                  river: t(locale, "map.river"),
                  pier: t(locale, "map.pier"),
                  bts: t(locale, "map.bts"),
                  road: t(locale, "map.road"),
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing invitation */}
      <section className="tkh-below-section border-t border-line bg-white px-5 py-24 text-center sm:px-8 md:py-28">
        <Reveal className="mx-auto max-w-[720px]">
          <span className="rule mx-auto" aria-hidden />
          <h2 className="mt-8">{t(locale, "cta.h2")}</h2>
          <p className="lead mx-auto mt-5 max-w-[56ch]">{t(locale, "cta.p")}</p>
          <Link href="/book" prefetch={false} className="btn-primary mt-10 px-9">
            {t(locale, "cta.btn")}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
