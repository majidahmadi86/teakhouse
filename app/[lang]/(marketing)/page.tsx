import { HomeHero } from "@/components/home/HomeHero";
import { HomeBelowFold } from "@/components/home/HomeBelowFold";
import { StaySearch } from "@/components/stay/StaySearch";
import { pageLang, type LangParams } from "@/lib/pageLocale";

/**
 * Server page · locale + hero + below-fold all render server-side in one paint.
 * The hero's booking pill is the same StaySearch form as every page's booking
 * bar: server HTML with no hydration (it used to mount a client widget with
 * framer-motion and a day picker 300 ms after load).
 */
export default function HomePage({ params }: { params: LangParams }) {
  const locale = pageLang(params);

  return (
    <>
      <HomeHero locale={locale} searchSlot={<StaySearch locale={locale} variant="hero" />} />
      <HomeBelowFold locale={locale} />
    </>
  );
}
