"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { unsplashSrc } from "@/lib/unsplashLoader";

const SLIDES = [
  {
    // Same-origin AVIF LCP — visually identical to Unsplash slide 1
    localMobile: "/hero-lcp-828.avif",
    localDesktop: "/hero-lcp-1920.avif",
    src: unsplashSrc("photo-1520250497591-112f2f40a3f4"),
    alt: "Resort pool at dusk overlooking the Chao Phraya",
    zoom: "in" as const,
    position: "object-[center_32%] md:object-[center_42%]",
  },
  {
    src: unsplashSrc("photo-1611892440504-42a792e24d32"),
    alt: "Sharp luxury bedroom with teak finishes",
    zoom: "out" as const,
    position: "object-[center_40%] md:object-[center_45%]",
  },
  {
    src: unsplashSrc("photo-1600585154340-be6161a56a0c"),
    alt: "Warm teak house interior living space",
    zoom: "in" as const,
    position: "object-[center_40%] md:object-[center_45%]",
  },
];

const HOLD_MS = 7000;

const HeroCrossfade = dynamic(
  () => import("./HeroCrossfade").then((m) => m.HeroCrossfade),
  { ssr: false }
);

export function HeroSlideshow() {
  const [reduce, setReduce] = useState(false);
  const [index, setIndex] = useState(0);
  const [lazyReady, setLazyReady] = useState(false);
  const [kenBurns, setKenBurns] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    const enable = () => {
      if (cancelled) return;
      setLazyReady(true);
      setKenBurns(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(enable, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [reduce]);

  useEffect(() => {
    if (reduce || !lazyReady) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduce, lazyReady]);

  const slide0 = SLIDES[0];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={cn(
          "absolute inset-0",
          kenBurns && index === 0 && !reduce && "tkh-ken-burns-in",
          !reduce && index !== 0 && "opacity-0"
        )}
        aria-hidden={!reduce && index !== 0}
      >
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet={slide0.localMobile}
            type="image/avif"
          />
          <img
            src={slide0.localDesktop}
            alt={slide0.alt}
            fetchPriority="high"
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              slide0.position
            )}
          />
        </picture>
      </div>

      {!reduce && lazyReady ? (
        <HeroCrossfade
          slides={SLIDES}
          index={index}
          holdMs={HOLD_MS}
          kenBurns={kenBurns}
        />
      ) : null}
    </div>
  );
}
