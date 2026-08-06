"use client";

import { useEffect, useState } from "react";
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
  const [rating, setRating] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) {
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
  }, []);

  const display = (reduce ? 5 : rating).toFixed(1);

  return (
    <p
      className={cn(
        "tkh-hero-fade mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white/90",
        className
      )}
      style={{ animationDelay: "1.05s" }}
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
    </p>
  );
}
