"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroSlideshow } from "@/components/hero/HeroSlideshow";
import { HeroTrustRow } from "@/components/hero/HeroTrustRow";
import { useI18n } from "@/lib/i18n";

const HeroSearchPill = dynamic(
  () =>
    import("@/components/hero/HeroSearchPill").then((mod) => mod.HeroSearchPill),
  {
    ssr: false,
    loading: () => (
      <div className="h-14 w-full animate-pulse rounded-full bg-white shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px]" />
    ),
  }
);

const HomeBelowFold = dynamic(
  () =>
    import("@/components/home/HomeBelowFold").then((mod) => mod.HomeBelowFold),
  { ssr: false }
);

const spring = { type: "spring" as const, stiffness: 120, damping: 16 };

export default function HomePage() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [belowReady, setBelowReady] = useState(false);
  const wordCount = t("hero.h1").split(" ").length;
  const subDelay = wordCount * 0.09 + 0.15;
  const pillDelay = subDelay + 0.35;

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setBelowReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(enable, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return (
    <>
      <section
        id="tkh-hero"
        className="relative z-[1] h-[100svh] overflow-hidden bg-navy md:h-[min(86svh,820px)]"
      >
        <div className="absolute inset-0">
          <HeroSlideshow />
          <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
          <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
          <div className="hero-scrim absolute inset-0 hidden md:block" />
        </div>

        {/* Mobile: one-screen stack ? brand, headline, trust, search pill */}
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6 pt-20 md:hidden">
          <m.p
            className="font-display text-[11px] font-normal uppercase tracking-[0.28em] text-gold hero-brand-glow"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            {t("brand.name")}
          </m.p>
          <div className="mt-2">
            <HeroHeadline />
          </div>
          <HeroTrustRow compact className="mt-3 justify-start" />
          <m.div
            className="relative z-20 mt-4"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: pillDelay }}
          >
            <HeroSearchPill />
          </m.div>
        </div>

        {/* Desktop overlay */}
        <div className="absolute inset-0 hidden flex-col justify-end px-6 pb-10 pt-28 md:flex">
          <div className="mx-auto w-full max-w-[1180px]">
            <p className="eyebrow mb-3 text-gold hero-text-shadow">
              {t("hero.eyebrow")}
            </p>
            <HeroHeadline />
            <m.p
              className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/90 hero-text-shadow"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: subDelay, duration: 0.5 }}
            >
              {t("hero.lead")}
            </m.p>

            <m.div
              className="relative z-20 mt-7"
              initial={reduce ? false : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: pillDelay }}
            >
              <HeroSearchPill />
              <HeroTrustRow />
            </m.div>
          </div>
        </div>
      </section>

      {belowReady ? <HomeBelowFold /> : (
        <div className="min-h-[40vh] bg-white" aria-hidden />
      )}
    </>
  );
}
