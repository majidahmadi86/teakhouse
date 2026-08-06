"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroSlideshow } from "@/components/hero/HeroSlideshow";
import { HeroTrustRow } from "@/components/hero/HeroTrustRow";
import { deferHeavy } from "@/lib/deferHeavy";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useMediaQuery";

const HeroSearchPill = dynamic(
  () =>
    import("@/components/hero/HeroSearchPill").then((mod) => mod.HeroSearchPill),
  {
    ssr: false,
    loading: () => (
      <div className="h-14 w-full rounded-full bg-white shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px]" />
    ),
  }
);

const HomeBelowFold = dynamic(
  () =>
    import("@/components/home/HomeBelowFold").then((mod) => mod.HomeBelowFold),
  { ssr: false }
);

function PillPlaceholder() {
  return (
    <div
      className="h-14 w-full rounded-full bg-white shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px]"
      aria-hidden
    />
  );
}

export default function HomeClient({ heroLcp }: { heroLcp: ReactNode }) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [belowReady, setBelowReady] = useState(false);
  const [searchReady, setSearchReady] = useState(false);
  const wordCount = t("hero.h1").split(" ").length;
  const subDelay = wordCount * 0.09 + 0.15;
  const pillDelay = subDelay + 0.35;

  useEffect(() => {
    const cancelSearch = deferHeavy(() => setSearchReady(true), 15000);
    const cancelBelow = deferHeavy(() => setBelowReady(true), 16000);
    return () => {
      cancelSearch();
      cancelBelow();
    };
  }, []);

  return (
    <>
      <section
        id="tkh-hero"
        className="relative z-[1] h-[100svh] overflow-hidden bg-navy md:h-[min(86svh,820px)]"
      >
        <div className="absolute inset-0">
          <HeroSlideshow lcp={heroLcp} />
          <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
          <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
          <div className="hero-scrim absolute inset-0 hidden md:block" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6 pt-20 md:hidden">
          <p
            className="tkh-hero-fade font-display text-[11px] font-normal uppercase tracking-[0.28em] text-gold hero-brand-glow"
            style={{ animationDuration: "0.55s" }}
          >
            {t("brand.name")}
          </p>
          <div className="mt-2">
            <HeroHeadline />
          </div>
          <HeroTrustRow compact className="mt-3 justify-start" />
          <div
            className="tkh-hero-fade relative z-20 mt-4"
            style={{ animationDelay: `${pillDelay}s` }}
          >
            {searchReady && isMobile ? <HeroSearchPill /> : <PillPlaceholder />}
          </div>
        </div>

        <div className="absolute inset-0 hidden flex-col justify-end px-6 pb-10 pt-28 md:flex">
          <div className="mx-auto w-full max-w-[1180px]">
            <p className="eyebrow mb-3 text-gold hero-text-shadow">
              {t("hero.eyebrow")}
            </p>
            <HeroHeadline />
            <p
              className="tkh-hero-fade mt-5 max-w-[52ch] text-lg leading-relaxed text-white/90 hero-text-shadow"
              style={{ animationDelay: `${subDelay}s` }}
            >
              {t("hero.lead")}
            </p>

            <div
              className="tkh-hero-fade relative z-20 mt-7"
              style={{ animationDelay: `${pillDelay}s` }}
            >
              {searchReady && !isMobile ? (
                <HeroSearchPill />
              ) : (
                <PillPlaceholder />
              )}
              <HeroTrustRow />
            </div>
          </div>
        </div>
      </section>

      {belowReady ? (
        <HomeBelowFold />
      ) : (
        <div className="min-h-[40vh] bg-white" aria-hidden />
      )}
    </>
  );
}
