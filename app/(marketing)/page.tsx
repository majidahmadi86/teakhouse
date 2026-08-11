import { HomeHero } from "@/components/home/HomeHero";
import { DeferredHeroSearch } from "@/components/hero/DeferredHeroSearch";
import { defaultSearchDateLabel } from "@/components/hero/HeroSearchPillShell";

/** Server page: preload + RSC hero · booking widget shell paints with zero JS. */
export default function HomePage() {
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
        searchSlot={
          <DeferredHeroSearch
            checkInLabel={dateLabel}
            guestLabel="2 guests"
            checkRatesLabel="Check rates"
            tonightLabel="Tonight from ฿2,100"
          />
        }
      />
    </>
  );
}
