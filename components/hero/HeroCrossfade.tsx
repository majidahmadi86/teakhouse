"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

const FADE_S = 1.25;
const HERO_SIZES = "(max-width: 768px) 100vw, 100vw";
const EASE = [0.22, 1, 0.36, 1] as const;

type Slide = {
  src: string;
  alt: string;
  zoom: "in" | "out";
  position: string;
};

/** Later slides — wait for decode before fading in so photos never pop. */
export function HeroCrossfade({
  slides,
  index,
  holdMs,
  kenBurns,
}: {
  slides: Slide[];
  index: number;
  holdMs: number;
  kenBurns: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [index]);

  if (index === 0) return null;
  const active = slides[index];
  const targetScale = active.zoom === "in" ? 1.06 : 1.03;

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={`${active.src}-${index}`}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: FADE_S, ease: EASE }}
      >
        <motion.div
          className="absolute inset-0 origin-center"
          initial={{ scale: 1 }}
          animate={
            kenBurns && loaded
              ? { scale: targetScale }
              : { scale: 1 }
          }
          transition={{
            duration: holdMs / 1000,
            ease: "linear",
          }}
        >
          <SafeImage
            src={active.src}
            alt={active.alt}
            fill
            quality={78}
            sizes={HERO_SIZES}
            priority={false}
            onLoadingComplete={() => setLoaded(true)}
            className={cn("object-cover", active.position)}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
