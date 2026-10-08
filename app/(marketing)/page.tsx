import { HomeHero } from "@/components/home/HomeHero";
import { HomeBelowFold } from "@/components/home/HomeBelowFold";
import { StaySearch } from "@/components/stay/StaySearch";
import { getServerLocale } from "@/lib/serverLocale";

/**
 * Server page · locale + hero + below-fold all render server-side in one paint.
 * The hero's booking pill is the same StaySearch form as every page's booking
 * bar: server HTML with no hydration (it used to mount a client widget with
 * framer-motion and a day picker 300 ms after load).
 */
export default function HomePage() {
  const locale = getServerLocale();

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
      <HomeHero locale={locale} searchSlot={<StaySearch locale={locale} variant="hero" />} />
      <HomeBelowFold locale={locale} />
    </>
  );
}
