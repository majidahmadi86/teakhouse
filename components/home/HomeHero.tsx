import { ArtPicture } from "@/components/ArtPicture";
import { t, type Lang } from "@/lib/serverLocale";

/**
 * The home hero · server HTML, zero client JS of its own.
 *
 * One bright, full-bleed photograph (the glass and teak lounge over the
 * river; a 4:5 crop on phones) with only a light, local gradient where the
 * words sit. The booking panel (StaySearch, a real GET form) floats over the
 * foot of the photograph on desktop and sits just under it on phones, so the
 * whole booking bar is above the fold at 1366x768 and 390x844.
 */
export function HomeHero({ locale, searchSlot }: { locale: Lang; searchSlot: React.ReactNode }) {
  return (
    <section id="tkh-hero" className="tkh-hero-under relative">
      <div className="relative h-[calc(min(125vw,100svh-var(--header-h)-var(--demo-bar-h)-170px)+var(--header-h))] min-h-[400px] overflow-hidden md:h-[calc(min(100svh-var(--header-h)-var(--util-h)-var(--demo-bar-h)-52px,820px)+var(--util-h)+var(--header-h))] md:min-h-[600px]">
        <ArtPicture
          id="hero-home"
          phoneId="hero-home-m"
          alt={t(locale, "home.heroAlt")}
          priority
          className="tkh-ken-burns-live"
        />
        <div className="hero-veil-bottom absolute inset-x-0 bottom-0 h-3/4 md:hidden" aria-hidden />
        <div className="hero-veil absolute inset-0 hidden md:block" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 md:inset-0">
          <div className="wrap flex h-full flex-col justify-end pb-6 md:justify-center md:pb-28 md:pt-[calc(var(--util-h)+var(--header-h))]">
            <div className="max-w-[640px] text-white">
              <p className="tkh-hero-in hero-text-shadow text-[12px] font-semibold uppercase tracking-[0.22em] text-white/90 md:text-[13px]">
                {t(locale, "home.eyebrow")}
              </p>
              <h1 className="tkh-hero-rise hero-text-shadow mt-3 text-[clamp(2.25rem,6.4vw,4.75rem)] !leading-[1.04] text-white md:mt-5">
                {t(locale, "home.h1")}
              </h1>
              <p className="tkh-hero-in tkh-hero-in-2 hero-text-shadow mt-5 hidden max-w-[52ch] text-[18px] leading-relaxed text-white/95 md:block">
                {t(locale, "home.lead")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="tkh-hero-actions" className="relative z-10 px-4 sm:px-8 md:-mt-[88px]">
        <div className="mx-auto -mt-3 max-w-[1080px] md:mt-0">{searchSlot}</div>
      </div>
    </section>
  );
}
