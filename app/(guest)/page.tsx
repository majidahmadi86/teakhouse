"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, MessageCircle, User } from "lucide-react";
import { RoomCard } from "@/components/RoomCard";
import { SafeImage } from "@/components/SafeImage";
import {
  MotionCard,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/motion/Reveal";
import { useGuestRooms } from "@/lib/ownerStore";
import { useI18n } from "@/lib/i18n";

const AvailBar = dynamic(
  () => import("@/components/AvailBar").then((m) => m.AvailBar),
  {
    ssr: false,
    loading: () => (
      <div className="h-[72px] animate-pulse rounded-2xl bg-white/90 shadow-2xl" />
    ),
  }
);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=2400&q=85";

const TRUST_KEYS = ["trust.1", "trust.2", "trust.3", "trust.4"] as const;
const OFFERS = ["1", "2", "3"] as const;

function TrustBadges({ mobile }: { mobile?: boolean }) {
  const { t } = useI18n();

  if (mobile) {
    return (
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {TRUST_KEYS.map((key) => (
          <li key={key} className="text-[13px] font-bold text-ink/80">
            {t(key)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 text-[13px] font-bold text-white/95">
      {TRUST_KEYS.map((key, i) => (
        <span key={key} className="inline-flex items-center gap-2">
          {i > 0 ? <span aria-hidden>·</span> : null}
          {t(key)}
        </span>
      ))}
    </p>
  );
}

function HeroWords({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return (
      <h1 className="max-w-[14ch] font-display text-[2.1rem] leading-[1.2] text-white hero-text-shadow md:max-w-[16ch] md:text-[clamp(2.6rem,5vw,4.2rem)]">
        {text}
      </h1>
    );
  }

  return (
    <h1 className="max-w-[14ch] font-display text-[2.1rem] leading-[1.2] text-white hero-text-shadow md:max-w-[16ch] md:text-[clamp(2.6rem,5vw,4.2rem)]">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="mr-[0.28em] inline-block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}
        </motion.span>
      ))}
    </h1>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const rooms = useGuestRooms().slice(0, 3);
  const reduce = useReducedMotion();

  return (
    <>
      <section className="relative z-[1] overflow-visible bg-cloud md:h-[78svh]">
        <div className="relative z-[1] h-[58svh] overflow-visible md:absolute md:inset-0 md:h-full">
          <div className="absolute inset-0 overflow-hidden">
            <SafeImage
              src={HERO_IMAGE}
              alt="Long-tail boats and limestone cliffs"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="hero-scrim absolute inset-0" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-6 pt-28 md:pb-8">
            <div className="mx-auto w-full max-w-[1180px]">
              <p className="eyebrow mb-3 text-gold hero-text-shadow">
                {t("hero.eyebrow")}
              </p>
              <HeroWords text={t("hero.h1")} />
              <motion.p
                className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/90 hero-text-shadow"
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
              >
                {t("hero.lead")}
              </motion.p>

              <motion.div
                className="relative z-20 mt-8 hidden md:block"
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
              >
                <AvailBar variant="hero" showNote={false} />
                <motion.div
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <TrustBadges />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="relative z-20 px-6 py-6 md:hidden">
          <AvailBar variant="hero" showNote={false} />
          <TrustBadges mobile />
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
            <Link href="/rooms" className="btn-navy mt-8 inline-flex">
              {t("about.cta")}
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[14px] shadow-panel">
              <SafeImage
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
                alt="Teak house interior"
                width={1200}
                height={1500}
                className="aspect-[4/5] w-full object-cover transition duration-500 hover:scale-[1.06]"
              />
            </div>
          </Reveal>
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
            <Link href="/rooms" className="btn-secondary">
              {t("rooms.all")}
            </Link>
          </p>
        </div>
      </section>

      <section className="section-pad bg-coral-bg">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3.5">{t("off.eyebrow")}</p>
              <h2>{t("off.strip")}</h2>
            </div>
            <Link href="/offers" className="text-sm font-bold text-coral-deep underline">
              {t("off.seeAll")}
            </Link>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-5 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <MotionCard className="tkh-card block p-6">
                  <Link href="/offers" className="block">
                    <span className="urgency-chip">{t(`off.${n}.badge`)}</span>
                    <h3 className="mt-4 font-display text-xl text-ink">
                      {t(`off.${n}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-sub">
                      {t(`off.${n}.body`)}
                    </p>
                  </Link>
                </MotionCard>
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
          <Link href="/book" className="btn-primary mt-8 inline-flex">
            {t("cta.btn")}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
