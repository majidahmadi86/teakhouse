"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { unsplashSrc } from "@/lib/unsplashLoader";
import type { Lang } from "@/lib/translate";

const SLIDES = [
  {
    src: unsplashSrc("photo-1520250497591-112f2f40a3f4"),
    alt: { en: "Resort pool at dusk overlooking the Chao Phraya", th: "สระว่ายน้ำยามเย็นมองเห็นแม่น้ำเจ้าพระยา" },
    zoom: "in" as const,
    position: "object-[center_32%] md:object-[center_42%]",
  },
  {
    src: unsplashSrc("photo-1611892440504-42a792e24d32"),
    alt: { en: "Sharp luxury bedroom with teak finishes", th: "ห้องนอนหรูตกแต่งไม้สัก" },
    zoom: "out" as const,
    position: "object-[center_40%] md:object-[center_45%]",
  },
  {
    src: unsplashSrc("photo-1600585154340-be6161a56a0c"),
    alt: { en: "Warm teak house interior living space", th: "มุมนั่งเล่นอบอุ่นในบ้านไม้สัก" },
    zoom: "in" as const,
    position: "object-[center_40%] md:object-[center_45%]",
  },
];

const HOLD_MS = 7000;

const HeroCrossfade = dynamic(
  () => import("./HeroCrossfade").then((m) => m.HeroCrossfade),
  { ssr: false }
);

/**
 * Overlay-only slideshow · server HeroLCP stays underneath.
 * Starts at slide 1 so we never re-fetch the LCP frame via Unsplash.
 */
export function HeroSlideshow({
  lcp: _lcp,
  locale,
}: {
  lcp?: React.ReactNode;
  /** Resolved by the layout · home renders outside the i18n provider. */
  locale: Lang;
}) {
  const [reduce, setReduce] = useState(false);
  const [index, setIndex] = useState(1);
  const [lazyReady, setLazyReady] = useState(false);

  useEffect(() => {
    /**
     * Desktop only, at the same 769px line the Ken Burns animation already uses.
     *
     * On a phone this crossfade cost far more than it gave. It swaps a
     * full-bleed hero every seven seconds, which means two extra Unsplash
     * frames pulled over mobile data (home measured 625KB against /rooms'
     * 363KB) and, worse, a viewport that is still visibly changing long after
     * first paint · Speed Index measures exactly that, and it sat at 4.7s
     * against a 0.98s FCP, holding home mobile at 91-94 on PageSpeed.
     *
     * The static server hero underneath is the real LCP and is complete on its
     * own, so a phone now gets one sharp photograph and desktop keeps the
     * slideshow. `reduce` covers prefers-reduced-motion the same way.
     */
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 769px)");
    const evaluate = () => setReduce(motion.matches || !wide.matches);
    evaluate();
    motion.addEventListener("change", evaluate);
    wide.addEventListener("change", evaluate);
    return () => {
      motion.removeEventListener("change", evaluate);
      wide.removeEventListener("change", evaluate);
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setLazyReady(true), 400);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  useEffect(() => {
    if (reduce || !lazyReady) return;
    const id = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % SLIDES.length;
        return next === 0 ? 1 : next;
      });
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduce, lazyReady]);

  if (reduce || !lazyReady) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <HeroCrossfade
        slides={SLIDES}
        index={index}
        holdMs={HOLD_MS}
        kenBurns={!reduce}
        locale={locale}
      />
    </div>
  );
}
