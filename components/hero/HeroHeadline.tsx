"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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

/** CSS word reveal — no framer on the LCP path. */
export function HeroHeadline({ className }: { className?: string }) {
  const { t, lang } = useI18n();
  const text = t("hero.h1");
  const words = text.split(" ");
  const accent =
    lang === "th"
      ? (w: string) => w === "ริมน้ำ"
      : (w: string) => w.toLowerCase().replace(/[.,]/g, "") === "river";

  const h1Class = cn(
    "max-w-[15ch] leading-[1.12] text-white hero-text-shadow md:max-w-[16ch] md:leading-[1.15]",
    lang === "th"
      ? "font-th-display text-[2.25rem] font-semibold md:text-[clamp(2.5rem,4.8vw,3.8rem)]"
      : "font-display text-[2.35rem] md:text-[clamp(2.7rem,5vw,4.3rem)]",
    className
  );

  return (
    <h1 className={h1Class}>
      {words.map((w, i) => {
        const bare = w.replace(/[.,]/g, "");
        const punct = w.slice(bare.length);
        const isAccent = accent(w);
        return (
          <span
            key={`${w}-${i}`}
            className="tkh-hero-word mr-[0.28em] inline-block"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {isAccent ? (
              <AccentWord word={bare} italic={lang !== "th"} />
            ) : (
              bare
            )}
            {punct}
          </span>
        );
      })}
    </h1>
  );
}
