import { HeroLCP } from "@/components/hero/HeroLCP";
import { t, type Lang } from "@/lib/serverLocale";

const GRADIENT = "linear-gradient(105deg, #E8C87A 0%, #FF6B4A 100%)";

/**
 * Server-rendered home hero · one complete paint in the resolved locale.
 * Zero client JS for the headline/eyebrow/subtitle/trust · the booking widget
 * ships as a styled SSR shell (searchSlot) and hydrates for interactivity only.
 */
export function HomeHero({
  locale,
  searchSlot,
}: {
  locale: Lang;
  searchSlot: React.ReactNode;
}) {
  const h1 = t(locale, "hero.h1");
  const brandName = t(locale, "brand.name");
  const googleLabel = t(locale, "hero.google", { n: "5.0" });

  return (
    <section
      id="tkh-hero"
      className="relative z-[1] -mt-[calc(var(--demo-bar-h)+var(--header-h))] h-[100svh] overflow-hidden bg-navy md:h-[min(100svh,820px)]"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <HeroLCP />
        </div>
        <div id="tkh-hero-slideshow" className="absolute inset-0" />
        <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
        <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
        <div className="hero-scrim absolute inset-0 hidden md:block" />
      </div>

      {/* Mobile */}
      <div className="tkh-hero-copy absolute inset-0 flex flex-col md:hidden">
        <div className="hero-chrome-pad relative z-10 px-5">
          <p className="font-display text-[11px] font-normal uppercase tracking-[0.28em] text-gold hero-brand-glow">
            {brandName}
          </p>
          <div className="mt-2">
            <h1 className="max-w-[15ch] font-display text-[2.35rem] leading-[1.12] text-white hero-text-shadow">
              <Headline text={h1} accent={locale === "en"} />
            </h1>
          </div>
          <p className="mt-3 flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-[13px] font-semibold text-white/90">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-navy/70 px-3 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur-md">
              <span className="tracking-[1px] text-gold" aria-hidden>
                ★★★★★
              </span>
              <span>{googleLabel}</span>
            </span>
          </p>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div id="tkh-hero-actions" className="relative z-20 px-5 hero-actions-pb">
          <div className="hero-copy-panel">
            <p className="hero-lead-mobile text-white hero-text-shadow">
              {t(locale, "hero.leadShort")}
            </p>
            <div className="relative z-20 mt-3 pt-1">{searchSlot}</div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="tkh-hero-copy hero-chrome-pad absolute inset-0 hidden flex-col justify-end px-6 pb-10 md:flex">
        <div className="mx-auto w-full max-w-[1180px]">
          <p className="eyebrow mb-3 text-gold hero-text-shadow">
            {t(locale, "hero.eyebrow")}
          </p>
          <h1 className="max-w-[16ch] font-display text-[clamp(2.7rem,5vw,4.3rem)] leading-[1.15] text-white hero-text-shadow">
            <Headline text={h1} accent={locale === "en"} desktop />
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white hero-text-shadow hero-copy-panel">
            {t(locale, "hero.lead")}
          </p>
          <div className="relative z-20 mt-7">
            {searchSlot}
            <p className="hero-copy-panel mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-navy/70 px-3 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur-md">
                <span className="tracking-[1px] text-gold" aria-hidden>
                  ★★★★★
                </span>
                <span>{googleLabel}</span>
              </span>
              <span aria-hidden>·</span>
              <span>{t(locale, "trust.1")}</span>
              <span aria-hidden>·</span>
              <span>{t(locale, "trust.freeShort")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Headline · gradient-italic accent on the word "river" for EN only. */
function Headline({
  text,
  accent,
  desktop,
}: {
  text: string;
  accent: boolean;
  desktop?: boolean;
}) {
  if (!accent) {
    return <>{text}</>;
  }
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const bare = w.replace(/[.,]/g, "");
        const punct = w.slice(bare.length);
        const isAccent = bare.toLowerCase() === "river";
        return (
          <span
            key={`${desktop ? "d" : "m"}-${w}-${i}`}
            className="mr-[0.28em] inline-block"
          >
            {isAccent ? (
              <span
                className="bg-clip-text italic text-transparent [text-shadow:none]"
                style={{
                  backgroundImage: GRADIENT,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                {bare}
              </span>
            ) : (
              bare
            )}
            {punct}
          </span>
        );
      })}
    </>
  );
}
