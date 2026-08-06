"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OFFER_STYLES = {
  "1": {
    gradient: "linear-gradient(145deg, #FF6B4A 0%, #E14F2E 100%)",
    numeral: "15%",
    goldLine: false,
  },
  "2": {
    gradient: "linear-gradient(145deg, #0A6CDE 0%, #0857BE 100%)",
    numeral: "20%",
    goldLine: false,
  },
  "3": {
    gradient: "linear-gradient(145deg, #0A2E5C 0%, #0A1B2E 100%)",
    numeral: "FREE",
    goldLine: true,
  },
} as const;

const spring = { type: "spring" as const, stiffness: 120, damping: 14 };

type OfferCardProps = {
  n: "1" | "2" | "3";
  large?: boolean;
  className?: string;
};

export function OfferCard({ n, large, className }: OfferCardProps) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const style = OFFER_STYLES[n];

  return (
    <Link
      href="/book"
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 text-white shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-card-hover",
        large && "p-8 md:p-10",
        className
      )}
      style={{ background: style.gradient }}
    >
      <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-3 py-1 text-[0.7rem] font-bold text-white backdrop-blur-sm">
        {t(`off.${n}.badge`)}
      </span>

      <m.div
        className={cn(
          "mt-4 font-display font-normal leading-none text-white",
          large
            ? "text-[clamp(3.5rem,5vw,5rem)]"
            : "text-[clamp(3rem,4vw,4rem)]"
        )}
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={spring}
      >
        {style.numeral}
      </m.div>

      {style.goldLine ? (
        <div className="mt-3 h-0.5 w-12 bg-gold" aria-hidden />
      ) : null}

      <h3
        className={cn(
          "mt-4 font-display text-white",
          large ? "text-2xl md:text-[1.75rem]" : "text-xl"
        )}
      >
        {t(`off.${n}.title`)}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/90">
        {t(`off.${n}.body`)}
      </p>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-white transition group-hover:gap-2">
        {t("off.bookOffer")}
      </span>
    </Link>
  );
}
