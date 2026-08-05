"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function HeroTrustRow({
  className,
  compact,
}: {
  className?: string;
  /** Mobile: rating pill only, no secondary trust chain */
  compact?: boolean;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [rating, setRating] = useState(reduce ? 5 : 0);

  useEffect(() => {
    if (reduce) {
      setRating(5);
      return;
    }
    const start = performance.now();
    const dur = 400;
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      setRating(Math.round(p * 50) / 10);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const display = rating.toFixed(1);

  return (
    <motion.p
      className={cn(
        "mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white/90",
        className
      )}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.05, duration: 0.4 }}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/14 px-3 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur-md">
        <span className="tracking-[1px] text-gold" aria-hidden>
          ★★★★★
        </span>
        <span>{t("hero.google", { n: display })}</span>
      </span>
      {!compact ? (
        <>
          <span aria-hidden>·</span>
          <span>{t("trust.1")}</span>
          <span aria-hidden>·</span>
          <span>{t("trust.freeShort")}</span>
        </>
      ) : null}
    </motion.p>
  );
}
