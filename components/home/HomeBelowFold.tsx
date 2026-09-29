import Link from "next/link";
import { Calendar, MessageCircle, User } from "lucide-react";
import { LocalPicture } from "@/components/LocalPicture";
import { OfferCard } from "@/components/OfferCard";
import { HomeRoomCard } from "@/components/home/HomeRoomCard";
import {
  CurtainReveal,
  MotionCard,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/home/HomeReveal";
import { FACILITIES } from "@/lib/facilities";
import { getSeedGuestRooms } from "@/lib/guestRooms";
import {
  translate as t,
  translateEntry as tr,
  type Lang,
} from "@/lib/translate";

const OFFERS = ["1", "2", "3"] as const;

/**
 * Below-fold home sections · server-rendered directly in the page (RSC) with the
 * resolved locale, so they are fully visible static HTML at first paint · no
 * skeleton, no interaction, no content JS. The JS-free CSS reveals (HomeReveal)
 * play on load and fail open (content is visible even if animation never runs).
 * content-visibility keeps off-screen render cost off the LCP path.
 */
export function HomeBelowFold({ locale }: { locale: Lang }) {
  const rooms = getSeedGuestRooms().slice(0, 3);

  return (
    <>
      <section className="tkh-below-section section-pad bg-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 md:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-3.5">{t(locale, "about.eyebrow")}</p>
            <h2>{t(locale, "about.h2")}</h2>
            <p className="mt-5 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "about.p")}
            </p>
            <Link href="/rooms" className="btn-navy btn-lift mt-8 inline-flex">
              {t(locale, "about.cta")}
            </Link>
          </Reveal>
          <CurtainReveal>
            <div className="relative overflow-hidden rounded-[14px] shadow-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1120&q=70&auto=format&fit=crop"
                alt={tr(locale, {
                  en: "Teak house interior",
                  th: "บรรยากาศภายในบ้านไม้สัก",
                })}
                width={1120}
                height={1400}
                loading="lazy"
                decoding="async"
                className="aspect-[5/4] w-full object-cover transition duration-500 hover:scale-[1.06] md:aspect-[4/5]"
              />
            </div>
          </CurtainReveal>
        </div>
      </section>

      <section className="tkh-below-section section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[640px]">
            <p className="eyebrow mb-3.5">{t(locale, "rooms.eyebrow")}</p>
            <h2>{t(locale, "rooms.h2")}</h2>
            <p className="mt-4 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "rooms.p")}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RevealItem key={room.id}>
                <MotionCard>
                  <HomeRoomCard room={room} locale={locale} />
                </MotionCard>
              </RevealItem>
            ))}
          </RevealStagger>
          <p className="mt-10 text-center">
            <Link href="/rooms" className="btn-secondary btn-lift">
              {t(locale, "rooms.all")}
            </Link>
          </p>
        </div>
      </section>

      {/* Facilities strip · seven static cards, images lazy and size-reserved,
          each one a link into the facilities page. */}
      <section className="tkh-below-section section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[640px]">
              <p className="eyebrow mb-3.5">{t(locale, "fac.strip.eyebrow")}</p>
              <h2>{t(locale, "fac.strip.h2")}</h2>
              <p className="mt-4 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
                {t(locale, "fac.strip.p")}
              </p>
            </div>
            <Link
              href="/facilities"
              className="link-draw inline-flex items-center gap-1 text-sm font-bold text-blue"
            >
              {t(locale, "fac.strip.cta")}
              <span aria-hidden>→</span>
            </Link>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((facility) => (
              <RevealItem key={facility.key}>
                <Link
                  href="/facilities"
                  className="group block overflow-hidden rounded-[14px] bg-cloud shadow-card transition hover:shadow-card-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <LocalPicture
                      base={facility.base}
                      alt={tr(locale, facility.alt)}
                      width={640}
                      height={480}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                      className="transition duration-500 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-ink">
                      {t(locale, `${facility.key}.h`)}
                    </h3>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/75">
                      {t(locale, `${facility.key}.p`)}
                    </p>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* v12 · Beyond the rooms · three doors into the rest of the house:
          dining, events & spaces, facilities. Static server HTML like every
          other below-fold section. */}
      <section className="tkh-below-section section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[640px]">
            <p className="eyebrow mb-3.5">{t(locale, "beyond.eyebrow")}</p>
            <h2>{t(locale, "beyond.h2")}</h2>
            <p className="mt-4 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "beyond.p")}
            </p>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
            {(
              [
                {
                  href: "/dining",
                  base: "/images/facilities/pier-breakfast",
                  alt: { en: "Breakfast tables on the river pier", th: "โต๊ะอาหารเช้าริมท่าเรือ" },
                  h: "nav.dining",
                  p: "beyond.dining.p",
                },
                {
                  href: "/events",
                  base: "/images/facilities/courtyard-garden",
                  alt: { en: "Courtyard garden beside the riverside pavilion", th: "สวนในคอร์ตยาร์ดข้างศาลาริมแม่น้ำ" },
                  h: "nav.events",
                  p: "beyond.events.p",
                },
                {
                  href: "/facilities",
                  base: "/images/facilities/pool",
                  alt: { en: "Saltwater pool in the courtyard", th: "สระน้ำเกลือในคอร์ตยาร์ด" },
                  h: "nav.facilities",
                  p: "beyond.fac.p",
                },
              ] as const
            ).map((card) => (
              <RevealItem key={card.href}>
                <Link
                  href={card.href}
                  className="group block overflow-hidden rounded-[14px] bg-white shadow-card transition hover:shadow-card-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <LocalPicture
                      base={card.base}
                      alt={tr(locale, card.alt)}
                      width={640}
                      height={480}
                      sizes="(max-width: 768px) 100vw, 380px"
                      className="transition duration-500 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl text-ink">
                      {t(locale, card.h)}
                    </h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/75">
                      {t(locale, card.p)}
                    </p>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="tkh-below-section section-pad bg-coral-bg">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3.5 text-blue">{t(locale, "off.eyebrow")}</p>
              <h2>{t(locale, "off.strip")}</h2>
            </div>
            <Link
              href="/offers"
              className="link-draw inline-flex items-center gap-1 text-sm font-bold text-blue"
            >
              {t(locale, "off.seeAll")}
              <span aria-hidden>→</span>
            </Link>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <OfferCard n={n} locale={locale} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="tkh-below-section section-pad bg-navy text-white">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[620px]">
            <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {t(locale, "sys.eyebrow")}
            </p>
            <h2 className="text-white">{t(locale, "sys.h2")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-white/80">
              {t(locale, "sys.p")}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-7 md:grid-cols-3">
            {[
              { icon: MessageCircle, h: "sys.f1h", p: "sys.f1p" },
              { icon: Calendar, h: "sys.f2h", p: "sys.f2p" },
              { icon: User, h: "sys.f3h", p: "sys.f3p" },
            ].map(({ icon: Icon, h, p }) => (
              <RevealItem key={h}>
                <article className="rounded-[14px] border border-white/15 bg-white/5 p-7">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl text-white">{t(locale, h)}</h3>
                  <p className="text-[0.94rem] text-white/78">{t(locale, p)}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="tkh-below-section section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[620px]">
            <p className="eyebrow mb-3.5">{t(locale, "rev.eyebrow")}</p>
            <h2>{t(locale, "rev.h2")}</h2>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-7 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n) => (
              <RevealItem key={n}>
                <MotionCard className="rounded-[14px] bg-cloud p-8">
                  <div className="mb-3 tracking-[3px] text-coral" aria-hidden>
                    ★★★★★
                  </div>
                  <p className="text-[0.95rem]">{t(locale, `rev.${n}`)}</p>
                  <footer className="mt-4 text-[0.8rem] font-bold text-strike">
                    {t(locale, `rev.${n}a`)}
                  </footer>
                </MotionCard>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="tkh-below-section bg-cloud px-6 py-16 text-center">
        <Reveal>
          <h2>{t(locale, "cta.h2")}</h2>
          <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
            {t(locale, "cta.p")}
          </p>
          <Link href="/book" className="btn-primary btn-shine btn-lift mt-8 inline-flex">
            {t(locale, "cta.btn")}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
