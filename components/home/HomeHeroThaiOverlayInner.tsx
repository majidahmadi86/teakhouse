"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroTrustRow } from "@/components/hero/HeroTrustRow";
import { DeferredHeroSearch } from "@/components/hero/DeferredHeroSearch";
import { defaultSearchDateLabel } from "@/components/hero/HeroSearchPillShell";
import { useI18n } from "@/lib/i18n";

/** Thai copy overlay · loaded only when lang=th. */
export function HomeHeroThaiOverlayInner() {
  const { t } = useI18n();
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("tkh-hero");
    setRoot(el);
    if (el) el.setAttribute("data-lang", "th");
    return () => {
      el?.removeAttribute("data-lang");
    };
  }, []);

  if (!root) return null;

  const search = (
    <DeferredHeroSearch
      checkInLabel={defaultSearchDateLabel()}
      guestLabel={t("g2")}
      checkRatesLabel={t("avail.go")}
      tonightLabel={t("hero.tonight", { z: "฿2,100" })}
    />
  );

  return createPortal(
    <>
      <div className="absolute inset-0 z-[2] flex flex-col md:hidden">
        <div className="relative z-10 px-5 pt-6">
          <p className="font-th-display text-[11px] font-normal uppercase tracking-[0.28em] text-gold hero-brand-glow">
            {t("brand.name")}
          </p>
          <div className="mt-2">
            <HeroHeadline />
          </div>
          <HeroTrustRow compact className="mt-3 justify-start" />
        </div>
        <div className="min-h-0 flex-1" aria-hidden />
        <div className="relative z-20 px-5 hero-actions-pb">
          <div className="hero-copy-panel">
            <p className="hero-lead-mobile text-white hero-text-shadow">
              {t("hero.leadShort")}
            </p>
            <div className="relative z-20 mt-3 pt-1">{search}</div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-[2] hidden flex-col justify-end px-6 pb-10 pt-28 md:flex">
        <div className="relative z-10 mx-auto w-full max-w-[1180px]">
          <p className="eyebrow mb-3 text-gold hero-text-shadow">
            {t("hero.eyebrow")}
          </p>
          <HeroHeadline />
          <p className="hero-copy-panel mt-5 max-w-[52ch] text-lg leading-relaxed text-white hero-text-shadow">
            {t("hero.lead")}
          </p>
          <div className="relative z-20 mt-7">
            {search}
            <div className="hero-copy-panel mt-4">
              <HeroTrustRow />
            </div>
          </div>
        </div>
      </div>
    </>,
    root
  );
}
