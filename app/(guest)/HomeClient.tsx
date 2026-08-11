"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroTrustRow } from "@/components/hero/HeroTrustRow";
import { useI18n } from "@/lib/i18n";

const HeroSearchPill = dynamic(
  () =>
    import("@/components/hero/HeroSearchPill").then((mod) => mod.HeroSearchPill),
  {
    ssr: false,
    loading: () => <SearchPillShell />,
  }
);

const HeroSlideshow = dynamic(
  () =>
    import("@/components/hero/HeroSlideshow").then((m) => m.HeroSlideshow),
  { ssr: false }
);

const HomeBelowFold = dynamic(
  () =>
    import("@/components/home/HomeBelowFold").then((mod) => mod.HomeBelowFold),
  { ssr: false }
);

function SearchPillShell() {
  return (
    <div
      className="h-14 w-full rounded-full bg-white shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px]"
      aria-hidden
    />
  );
}

/** Defer SearchPill chunk until idle / first interaction · keeps framer off LCP. */
function DeferredSearchPill() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const arm = () => {
      if (!cancelled) setReady(true);
    };
    const onInteract = () => {
      arm();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(arm, { timeout: 2800 });
    } else {
      timeoutId = window.setTimeout(arm, 2200);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return <SearchPillShell />;
  return <HeroSearchPill />;
}

function DeferredBelowFold() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const arm = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(arm, { timeout: 4500 });
    } else {
      timeoutId = window.setTimeout(arm, 3500);
    }
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <HomeBelowFold />;
}

export default function HomeClient({ heroLcp }: { heroLcp: ReactNode }) {
  const { t } = useI18n();
  const wordCount = t("hero.h1").split(" ").length;
  const subDelay = wordCount * 0.09 + 0.15;
  const pillDelay = subDelay + 0.35;

  return (
    <>
      <section
        id="tkh-hero"
        className="relative z-[1] h-[calc(100svh-3.5rem-var(--demo-bar-h))] overflow-hidden bg-navy md:h-[min(calc(86svh-var(--demo-bar-h)),820px)]"
      >
        <div className="absolute inset-0">
          {/* Server LCP paints immediately · slideshow overlays after idle */}
          <div className="absolute inset-0">{heroLcp}</div>
          <HeroSlideshowOverlay />
          <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
          <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
          <div className="hero-scrim absolute inset-0 hidden md:block" />
        </div>

        <div className="absolute inset-0 flex flex-col md:hidden">
          <div className="relative z-10 px-5 pt-6">
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
          </div>

          <div className="min-h-0 flex-1" aria-hidden />

          <div
            id="tkh-hero-actions"
            className="relative z-20 px-5 hero-actions-pb"
          >
            <p
              className="hero-lead-mobile tkh-hero-fade text-white/90 hero-text-shadow"
              style={{ animationDelay: `${subDelay}s` }}
            >
              {t("hero.leadShort")}
            </p>
            <div
              className="tkh-hero-fade relative z-20 mt-3 pt-3"
              style={{ animationDelay: `${pillDelay}s` }}
            >
              <DeferredSearchPill />
            </div>
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
              <DeferredSearchPill />
              <HeroTrustRow className="mt-4" />
            </div>
          </div>
        </div>
      </section>

      <DeferredBelowFold />
    </>
  );
}

/** Mount crossfade slideshow only after idle so Unsplash + framer stay off LCP. */
function HeroSlideshowOverlay() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const arm = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(arm, { timeout: 3500 });
    } else {
      timeoutId = window.setTimeout(arm, 2800);
    }
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <HeroSlideshow lcp={null} />;
}
