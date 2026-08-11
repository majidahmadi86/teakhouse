import { HomeHero } from "@/components/home/HomeHero";
import { HomeBelowFoldDeferred } from "@/components/home/HomeBelowFoldDeferred";
import { DeferredHeroSearch } from "@/components/hero/DeferredHeroSearch";
import { defaultSearchDateLabel } from "@/components/hero/HeroSearchPillShell";
import { getServerLocale, t } from "@/lib/serverLocale";

/** Server page · locale + hero + below-fold all render server-side in one paint. */
export default function HomePage() {
  const locale = getServerLocale();
  const dateLabel = defaultSearchDateLabel();

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-640.avif"
        type="image/avif"
        {...{ fetchPriority: "high" }}
      />
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-1920.avif"
        type="image/avif"
        media="(min-width: 769px)"
      />
      <HomeHero
        locale={locale}
        searchSlot={
          <DeferredHeroSearch
            checkInLabel={dateLabel}
            guestLabel={t(locale, "g2")}
            checkRatesLabel={t(locale, "avail.go")}
            tonightLabel={t(locale, "hero.tonight", { z: "฿2,100" })}
          />
        }
      />
      <HomeBelowFoldDeferred />
    </>
  );
}
