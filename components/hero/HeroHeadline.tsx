"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 120, damping: 14 };

const GRADIENT =
  "linear-gradient(105deg, #E8C87A 0%, #FF6B4A 100%)";

function AccentWord({ word, italic }: { word: string; italic?: boolean }) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent [text-shadow:none]",
        italic && "italic"
      )}
      style={{
        backgroundImage: GRADIENT,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}
    >
      {word}
    </span>
  );
}

export function HeroHeadline({ className }: { className?: string }) {
  const { t, lang } = useI18n();
  const reduce = useReducedMotion();
  const text = t("hero.h1");
  const words = text.split(" ");
  const accent =
    lang === "th"
      ? (w: string) => w === "ริมน้ำ"
      : (w: string) => w.toLowerCase().replace(/[.,]/g, "") === "river";

  const h1Class = cn(
    "max-w-[14ch] leading-[1.08] tracking-[-0.01em] text-white hero-text-shadow md:max-w-[16ch] md:leading-[1.15] md:tracking-normal",
    lang === "th"
      ? "font-th-display text-[2.45rem] font-semibold md:text-[clamp(2.5rem,4.8vw,3.8rem)]"
      : "font-display text-[2.55rem] md:text-[clamp(2.7rem,5vw,4.3rem)]",
    className
  );

  if (reduce) {
    return (
      <h1 className={h1Class}>
        {words.map((w, i) => (
          <span key={`${w}-${i}`} className="mr-[0.28em] inline-block">
            {accent(w) ? (
              <AccentWord
                word={w.replace(/[.,]/g, "")}
                italic={lang !== "th"}
              />
            ) : (
              w
            )}
            {w.endsWith(".") && accent(w) ? "." : ""}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <h1 className={h1Class}>
      {words.map((w, i) => {
        const bare = w.replace(/[.,]/g, "");
        const punct = w.slice(bare.length);
        const isAccent = accent(w);
        return (
          <motion.span
            key={`${w}-${i}`}
            className="mr-[0.28em] inline-block"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.09 }}
          >
            {isAccent ? (
              <AccentWord word={bare} italic={lang !== "th"} />
            ) : (
              bare
            )}
            {punct}
          </motion.span>
        );
      })}
    </h1>
  );
}
