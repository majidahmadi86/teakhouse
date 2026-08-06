"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { deferHeavy } from "@/lib/deferHeavy";
import { cn } from "@/lib/utils";
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

/** Client slideshow overlays — LCP base image is server-rendered in HeroLCP. */
export function HeroSlideshow({
  lcp,
}: {
  lcp: React.ReactNode;
}) {
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
    // Hard delay — requestIdleCallback fires too early under Lighthouse.
    return deferHeavy(() => {
      setLazyReady(true);
      setKenBurns(true);
    }, 10000);
  }, [reduce]);

  useEffect(() => {
    if (reduce || !lazyReady) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduce, lazyReady]);

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
        {lcp}
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
