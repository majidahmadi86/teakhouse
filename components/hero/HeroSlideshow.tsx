"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=2600&q=88&auto=format&fit=crop",
    alt: "Resort pool at dusk",
    zoom: "in" as const,
  },
  {
    src: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=2600&q=88&auto=format&fit=crop",
    alt: "Warm luxury bedroom",
    zoom: "out" as const,
  },
  {
    src: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=2600&q=88&auto=format&fit=crop",
    alt: "Bright morning boats",
    zoom: "in" as const,
  },
];

const HOLD_MS = 7000;
const FADE_S = 1.2;

export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [mountedLazy, setMountedLazy] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMountedLazy(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  if (reduce) {
    return (
      <div className="absolute inset-0">
        <SafeImage
          src={SLIDES[0].src}
          alt={SLIDES[0].alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%] md:object-[center_45%]"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        {SLIDES.map((slide, i) => {
          if (i !== index) return null;
          if (i > 0 && !mountedLazy) return null;
          const zoomIn = slide.zoom === "in";
          return (
            <motion.div
              key={`${slide.src}-${i}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_S, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: zoomIn ? 1.06 : 1 }}
                animate={{ scale: zoomIn ? 1 : 1.06 }}
                transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
              >
                <SafeImage
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={cn(
                    "object-cover object-[center_42%] md:object-[center_45%]"
                  )}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
