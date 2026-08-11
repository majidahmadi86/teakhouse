"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { unsplashSrc } from "@/lib/unsplashLoader";

const SLIDES = [
  {
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

/**
 * Overlay-only slideshow · server HeroLCP stays underneath.
 * Starts at slide 1 so we never re-fetch the LCP frame via Unsplash.
 */
export function HeroSlideshow({
  lcp: _lcp,
}: {
  lcp?: React.ReactNode;
}) {
  const [reduce, setReduce] = useState(false);
  const [index, setIndex] = useState(1);
  const [lazyReady, setLazyReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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
      />
    </div>
  );
}
