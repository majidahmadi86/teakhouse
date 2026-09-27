import { HeroLCP } from "@/components/hero/HeroLCP";
import { t, type Lang } from "@/lib/serverLocale";

const GRADIENT = "linear-gradient(105deg, #F1DFA8 0%, #C8A24E 100%)";

/**
 * v15 · Server-rendered home hero · one complete paint in the resolved locale.
 *
 * Editorial and centred: a small-capitals eyebrow, the headline in Cormorant
 * at the size of a magazine cover, a gold hairline, a short lead, and the
 * booking pill. Zero client JS for the copy · the pill ships as a styled SSR
 * shell (searchSlot) and hydrates for interactivity only. Ids and the layering
 * (#tkh-hero, #tkh-hero-slideshow, #tkh-hero-actions) stay as they were: the
 * slideshow, the FAB clearance and the acceptance suites key off them.
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
      className="relative z-[1] -mt-[calc(var(--demo-bar-h)+var(--header-h))] h-[100svh] overflow-hidden bg-navy md:h-[min(100svh,880px)]"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <HeroLCP locale={locale} />
        </div>
        <div id="tkh-hero-slideshow" className="absolute inset-0" />
        <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
        <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
        <div className="hero-scrim absolute inset-0 hidden md:block" />
      </div>

      {/* Mobile */}
      <div className="tkh-hero-copy absolute inset-0 flex flex-col md:hidden">
        <div className="hero-chrome-pad relative z-10 px-6 text-center">
          <p className="luxe-caps text-gold hero-brand-glow">{brandName}</p>
          <h1 className="mx-auto mt-4 max-w-[13ch] font-display text-[2.6rem] font-medium leading-[1.04] text-white hero-text-shadow">
            <Headline text={h1} accent={locale === "en"} />
          </h1>
          <span className="luxe-rule luxe-rule--center mt-5 opacity-90" aria-hidden />
          <p className="mx-auto mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
            <span className="tracking-[1px] text-gold" aria-hidden>
              ★★★★★
            </span>
            <span>{googleLabel}</span>
          </p>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div id="tkh-hero-actions" className="relative z-20 px-5 hero-actions-pb">
          <div className="hero-copy-panel">
            <p className="hero-lead-mobile text-center text-white hero-text-shadow">
              {t(locale, "hero.leadShort")}
            </p>
            <div className="relative z-20 mt-3 pt-1">{searchSlot}</div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="tkh-hero-copy hero-chrome-pad absolute inset-0 hidden flex-col items-center justify-center px-6 pb-12 pt-10 text-center md:flex">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className="luxe-caps mb-6 text-gold hero-text-shadow">{t(locale, "hero.eyebrow")}</p>
          <h1 className="mx-auto max-w-[15ch] font-display text-[clamp(3.4rem,6.2vw,6rem)] font-medium leading-[1.02] text-white hero-text-shadow">
            <Headline text={h1} accent={locale === "en"} desktop />
          </h1>
          <span className="luxe-rule luxe-rule--center mt-8 opacity-90" aria-hidden />
          <p className="mx-auto mt-7 max-w-[46ch] text-[1.08rem] leading-relaxed text-white/90 hero-text-shadow">
            {t(locale, "hero.lead")}
          </p>
          <div className="relative z-20 mx-auto mt-10 max-w-[880px]">
            {searchSlot}
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <span className="tracking-[1px] text-gold" aria-hidden>
                  ★★★★★
                </span>
                <span className="normal-case tracking-normal">{googleLabel}</span>
              </span>
              <span className="text-gold/70" aria-hidden>
                ·
              </span>
              <span>{t(locale, "trust.1")}</span>
              <span className="text-gold/70" aria-hidden>
                ·
              </span>
              <span>{t(locale, "trust.freeShort")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Headline · gold-italic accent on the word "river" for EN only. */
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
          <span key={`${desktop ? "d" : "m"}-${w}-${i}`} className="mr-[0.24em] inline-block">
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
