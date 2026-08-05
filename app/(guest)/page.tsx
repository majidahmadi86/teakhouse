"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, MessageCircle, User } from "lucide-react";
import { OfferCard } from "@/components/OfferCard";
import { RoomCard } from "@/components/RoomCard";
import { SafeImage } from "@/components/SafeImage";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroSlideshow } from "@/components/hero/HeroSlideshow";
import { HeroTrustRow } from "@/components/hero/HeroTrustRow";
import {
  CurtainReveal,
  MotionCard,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/motion/Reveal";
import { useGuestRooms } from "@/lib/ownerStore";
import { useI18n } from "@/lib/i18n";

const HeroSearchPill = dynamic(
  () =>
    import("@/components/hero/HeroSearchPill").then((m) => m.HeroSearchPill),
  {
    ssr: false,
    loading: () => (
      <div className="h-14 w-full animate-pulse rounded-full bg-white shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px]" />
    ),
  }
);

const OFFERS = ["1", "2", "3"] as const;
const spring = { type: "spring" as const, stiffness: 120, damping: 16 };

export default function HomePage() {
  const { t } = useI18n();
  const rooms = useGuestRooms().slice(0, 3);
  const reduce = useReducedMotion();
  const wordCount = t("hero.h1").split(" ").length;
  const subDelay = wordCount * 0.09 + 0.15;
  const pillDelay = subDelay + 0.35;

  return (
    <>
      <section
        id="tkh-hero"
        className="relative z-[1] h-[100svh] overflow-hidden bg-navy md:h-[min(86svh,820px)]"
      >
        <div className="absolute inset-0">
          <HeroSlideshow />
          {/* Mobile cinematic atmosphere */}
          <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
          <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
          {/* Desktop scrim */}
          <div className="hero-scrim absolute inset-0 hidden md:block" />
        </div>

        {/* Mobile: one-screen stack — brand, headline, trust, search pill */}
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6 pt-20 md:hidden">
          <motion.p
            className="font-display text-[11px] font-normal uppercase tracking-[0.28em] text-gold hero-brand-glow"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            {t("brand.name")}
          </motion.p>
          <div className="mt-2">
            <HeroHeadline />
          </div>
          <HeroTrustRow compact className="mt-3 justify-start" />
          <motion.div
            className="relative z-20 mt-4"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: pillDelay }}
          >
            <HeroSearchPill />
          </motion.div>
        </div>

        {/* Desktop overlay */}
        <div className="absolute inset-0 hidden flex-col justify-end px-6 pb-10 pt-28 md:flex">
          <div className="mx-auto w-full max-w-[1180px]">
            <p className="eyebrow mb-3 text-gold hero-text-shadow">
              {t("hero.eyebrow")}
            </p>
            <HeroHeadline />
            <motion.p
              className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/90 hero-text-shadow"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: subDelay, duration: 0.5 }}
            >
              {t("hero.lead")}
            </motion.p>

            <motion.div
              className="relative z-20 mt-7"
              initial={reduce ? false : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: pillDelay }}
            >
              <HeroSearchPill />
              <HeroTrustRow />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
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
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
                alt="Teak house interior"
                width={1200}
                height={1500}
                className="aspect-[4/5] w-full object-cover transition duration-500 hover:scale-[1.06]"
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
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
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
                  <div className="mb-3 tracking-[3px] text-coral">★★★★★</div>
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
