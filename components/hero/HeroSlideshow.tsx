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
/** Display sizes so 2–3× DPR caps downloads ≤828w mobile / ≤1920w desktop */
const HERO_SIZES = "(max-width: 768px) 276px, 640px";

function KenBurns({
  zoomIn,
  children,
  animate,
}: {
  zoomIn: boolean;
  children: React.ReactNode;
  animate: boolean;
}) {
  if (!animate) {
    return <div className="absolute inset-0">{children}</div>;
  }
  return (
    <m.div
      className="absolute inset-0"
      initial={{ scale: zoomIn ? 1.08 : 1 }}
      animate={{ scale: zoomIn ? 1 : 1.08 }}
      transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
    >
      {children}
    </m.div>
  );
}

export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [lazyReady, setLazyReady] = useState(false);
  const [kenBurns, setKenBurns] = useState(false);

  // Slides 2–3 + Ken Burns only after idle — never compete with LCP
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

  const active = SLIDES[reduce ? 0 : index];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* LCP layer: always painted at opacity 1, no fade-in */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          !reduce && index !== 0 ? "opacity-0" : "opacity-100"
        )}
        aria-hidden={!reduce && index !== 0}
      >
        <KenBurns zoomIn={SLIDES[0].zoom === "in"} animate={kenBurns && index === 0 && !reduce}>
          <SafeImage
            src={SLIDES[0].src}
            alt={SLIDES[0].alt}
            fill
            priority
            quality={75}
            sizes={HERO_SIZES}
            className={cn("object-cover", SLIDES[0].position)}
          />
        </KenBurns>
      </div>

      {!reduce ? (
        <AnimatePresence initial={false}>
          {index > 0 && lazyReady ? (
            <m.div
              key={`${active.src}-${index}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_S, ease: "easeInOut" }}
            >
              <KenBurns zoomIn={active.zoom === "in"} animate={kenBurns}>
                <SafeImage
                  src={active.src}
                  alt={active.alt}
                  fill
                  quality={75}
                  sizes={HERO_SIZES}
                  className={cn("object-cover", active.position)}
                />
              </KenBurns>
            </m.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
}
