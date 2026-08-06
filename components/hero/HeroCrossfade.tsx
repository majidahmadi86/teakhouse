"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

const FADE_S = 1.45;
const HERO_SIZES = "(max-width: 768px) 100vw, 100vw";

type Slide = {
  src: string;
  alt: string;
  zoom: "in" | "out";
  position: string;
  localMobile?: string;
  localDesktop?: string;
};

/** Loaded only after idle — framer stays off the LCP path. */
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
  if (index === 0) return null;
  const active = slides[index];
  const zoomIn = active.zoom === "in";

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={`${active.src}-${index}`}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: FADE_S, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0"
          initial={kenBurns ? { scale: zoomIn ? 1.08 : 1 } : false}
          animate={kenBurns ? { scale: zoomIn ? 1 : 1.08 } : undefined}
          transition={{ duration: holdMs / 1000, ease: "linear" }}
        >
          <SafeImage
            src={active.src}
            alt={active.alt}
            fill
            quality={75}
            sizes={HERO_SIZES}
            className={cn("object-cover", active.position)}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
