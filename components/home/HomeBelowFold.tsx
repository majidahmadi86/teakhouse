"use client";

import Link from "next/link";
import { Calendar, MessageCircle, User } from "lucide-react";
import { OfferCard } from "@/components/OfferCard";
import { RoomCard } from "@/components/RoomCard";
import { SafeImage } from "@/components/SafeImage";
import {
  CurtainReveal,
  MotionCard,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/motion/Reveal";
import { SEED_ROOMS } from "@/lib/rooms";
import { useI18n } from "@/lib/i18n";

const OFFERS = ["1", "2", "3"] as const;

/** Below-fold home sections — dynamically imported so hero LCP stays light. */
export function HomeBelowFold() {
  const { t } = useI18n();
  const rooms = SEED_ROOMS.filter((r) => r.active).slice(0, 3);

  return (
    <>
      <section className="section-pad bg-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 md:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-3.5">{t("about.eyebrow")}</p>
            <h2>{t("about.h2")}</h2>
            <p className="mt-5 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t("about.p")}
            </p>
            <Link href="/rooms" className="btn-navy btn-lift mt-8 inline-flex">
              {t("about.cta")}
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

      <section className="section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[640px]">
            <p className="eyebrow mb-3.5">{t("rooms.eyebrow")}</p>
            <h2>{t("rooms.h2")}</h2>
            <p className="mt-4 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t("rooms.p")}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RevealItem key={room.id}>
                <MotionCard>
                  <RoomCard room={room} />
                </MotionCard>
              </RevealItem>
            ))}
          </RevealStagger>
          <p className="mt-10 text-center">
            <Link href="/rooms" className="btn-secondary btn-lift">
              {t("rooms.all")}
            </Link>
          </p>
        </div>
      </section>

      <section className="section-pad bg-coral-bg">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3.5 text-blue">{t("off.eyebrow")}</p>
              <h2>{t("off.strip")}</h2>
            </div>
            <Link
              href="/offers"
              className="link-draw inline-flex items-center gap-1 text-sm font-bold text-blue"
            >
              {t("off.seeAll")}
              <span aria-hidden>→</span>
            </Link>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <OfferCard n={n} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="section-pad bg-navy text-white">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[620px]">
            <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {t("sys.eyebrow")}
            </p>
            <h2 className="text-white">{t("sys.h2")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-white/80">
              {t("sys.p")}
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
                  <h3 className="mb-2 text-xl text-white">{t(h)}</h3>
                  <p className="text-[0.94rem] text-white/78">{t(p)}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[620px]">
            <p className="eyebrow mb-3.5">{t("rev.eyebrow")}</p>
            <h2>{t("rev.h2")}</h2>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-7 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n) => (
              <RevealItem key={n}>
                <MotionCard className="rounded-[14px] bg-cloud p-8">
                  <div className="mb-3 tracking-[3px] text-coral" aria-hidden>
                    ★★★★★
                  </div>
                  <p className="text-[0.95rem]">{t(`rev.${n}`)}</p>
                  <footer className="mt-4 text-[0.8rem] font-bold text-strike">
                    {t(`rev.${n}a`)}
                  </footer>
                </MotionCard>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-cloud px-6 py-16 text-center">
        <Reveal>
          <h2>{t("cta.h2")}</h2>
          <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
            {t("cta.p")}
          </p>
          <Link href="/book" className="btn-primary btn-shine btn-lift mt-8 inline-flex">
            {t("cta.btn")}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
