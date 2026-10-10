import type { Metadata } from "next";
import { languageAlternates } from "@/lib/routeMeta";
import { ConciergeFabStatic } from "@/components/ConciergeFabStatic";
import { ConciergeLazy } from "@/components/ConciergeLazy";
import { FabHeroClearance } from "@/components/home/FabHeroClearance";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { SiteHeader } from "@/components/header/SiteHeader";
import { MobileBookBar } from "@/components/MobileBookBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getDemoStrings } from "@/lib/demoStrings";
import { t } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { CONCIERGE_KEYS, messagesFor } from "@/lib/locales";
import { RouteProgress } from "@/components/RouteProgress";
import { StayCalendarHost } from "@/components/stay/StayCalendarHost";
import { stayPickerLabels } from "@/components/stay/stayLabels";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: languageAlternates("/"),
  },
};

/**
 * Home layout · hero + below-fold are server components (rendered in the page)
 * so no provider sits on the LCP path. The header, the footer and the phone
 * Book bar are the same server chrome as every guest page, with no hydrated
 * twin. The hero is one photograph with no slideshow.
 */
export default function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LangParams;
}) {
  const locale = pageLang(params);
  return (
    <>
      <DemoModeBar variant="guest" locale={locale} />
      <SiteHeader locale={locale} overHero />
      <main className="pb-0">{children}</main>
      <SiteFooter locale={locale} />
      {/* On home the phone Book bar waits below the screen until the hero's
          own booking widget has scrolled away. */}
      <MobileBookBar locale={locale} deferUntilScroll />
      {/* Order modal host · CTA opens it via the shared window event. */}
      <DemoModal strings={getDemoStrings(locale)} />
      {/* Concierge · static server FAB (present in raw HTML) + scoped launcher */}
      {/* Compact on home · the hero booking widget shares this corner on a
          phone. FabHeroClearance expands it once the widget scrolls away. */}
      <ConciergeFabStatic label={t(locale, "cg.fab")} compact />
      <FabHeroClearance />
      <ConciergeLazy
        lang={locale}
        messages={messagesFor(locale, CONCIERGE_KEYS)}
        loadingLabel={t(locale, "cg.name")}
      />
      <RouteProgress label={t(locale, "a11y.loadingPage")} />
      {/* The booking bar's range calendar · one island for every form. */}
      <StayCalendarHost lang={locale} labels={stayPickerLabels(locale)} />
    </>
  );
}
