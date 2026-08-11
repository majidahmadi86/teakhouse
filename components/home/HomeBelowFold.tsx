import Link from "next/link";
import { Calendar, MessageCircle, User } from "lucide-react";
import { OfferCard } from "@/components/OfferCard";
import { HomeRoomCard } from "@/components/home/HomeRoomCard";
import { SafeImage } from "@/components/SafeImage";
import {
  CurtainReveal,
  MotionCard,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/home/HomeReveal";
import { getSeedGuestRooms } from "@/lib/guestRooms";
import { t, type Lang } from "@/lib/serverLocale";

const OFFERS = ["1", "2", "3"] as const;

/**
 * Below-fold home sections · server-rendered in the resolved locale so the
 * document has its full height (and a scrollbar) at first paint. Fully zero-JS
 * RSC · cards render server-side (base-currency price) so nothing hydrates here.
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
              <SafeImage
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                alt="Teak house interior"
                width={1200}
                height={1500}
                quality={75}
                sizes="(max-width: 768px) 100vw, 560px"
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
