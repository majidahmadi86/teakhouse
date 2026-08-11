import Link from "next/link";
import { translate, type Lang } from "@/lib/translate";
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

type OfferCardProps = {
  n: "1" | "2" | "3";
  locale: Lang;
  large?: boolean;
  className?: string;
};

/** Pure · renders server-side (RSC home) or client-side (offers page). */
export function OfferCard({ n, locale, large, className }: OfferCardProps) {
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
        {translate(locale, `off.${n}.badge`)}
      </span>

      <div
        className={cn(
          "tkh-pop mt-4 font-display font-normal leading-none text-white",
          large
            ? "text-[clamp(3.5rem,5vw,5rem)]"
            : "text-[clamp(3rem,4vw,4rem)]"
        )}
      >
        {style.numeral}
      </div>

      {style.goldLine ? (
        <div className="mt-3 h-0.5 w-12 bg-gold" aria-hidden />
      ) : null}

      <h3
        className={cn(
          "mt-4 font-display text-white",
          large ? "text-2xl md:text-[1.75rem]" : "text-xl"
        )}
      >
        {translate(locale, `off.${n}.title`)}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/90">
        {translate(locale, `off.${n}.body`)}
      </p>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-white transition group-hover:gap-2">
        {translate(locale, "off.bookOffer")}
      </span>
    </Link>
  );
}
