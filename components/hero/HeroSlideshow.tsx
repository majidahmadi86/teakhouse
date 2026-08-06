"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { unsplashSrc } from "@/lib/unsplashLoader";
import { cn } from "@/lib/utils";

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
const FADE_S = 1.2;
const HERO_SIZES = "(max-width: 768px) 276px, 640px";
// Display sizes chosen so 2–3× DPR caps downloads at ≤828w mobile / ≤1920w desktop

export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [lazyReady, setLazyReady] = useState(false);

  // Slides 2–3 only after idle — never compete with LCP
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setLazyReady(true);
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

  if (reduce) {
    return (
      <div className="absolute inset-0">
        <SafeImage
          src={SLIDES[0].src}
          alt={SLIDES[0].alt}
          fill
          priority
          quality={78}
          sizes={HERO_SIZES}
          className={cn("object-cover", SLIDES[0].position)}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        {SLIDES.map((slide, i) => {
          if (i !== index) return null;
          if (i > 0 && !lazyReady) return null;
          const zoomIn = slide.zoom === "in";
          return (
            <m.div
              key={`${slide.src}-${i}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_S, ease: "easeInOut" }}
            >
              <m.div
                className="absolute inset-0"
                initial={{ scale: zoomIn ? 1.08 : 1 }}
                animate={{ scale: zoomIn ? 1 : 1.08 }}
                transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
              >
                <SafeImage
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  quality={78}
                  sizes={HERO_SIZES}
                  className={cn("object-cover", slide.position)}
                />
              </m.div>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
