import type { Metadata } from "next";
import { ConciergeFabStatic } from "@/components/ConciergeFabStatic";
import { ConciergeMount } from "@/components/ConciergeLauncher";
import { FabHeroClearance } from "@/components/home/FabHeroClearance";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { SiteHeader } from "@/components/header/SiteHeader";
import { MobileBookBar } from "@/components/MobileBookBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HomeLate } from "@/components/home/HomeLate";
import { getDemoStrings } from "@/lib/demoStrings";
import { getServerLocale, t } from "@/lib/serverLocale";
import { messagesFor } from "@/lib/locales";
import { RouteProgress } from "@/components/RouteProgress";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/**
 * Home layout · hero + below-fold are server components (rendered in the page)
 * so no provider sits on the LCP path. The header, the footer and the phone
 * Book bar are the same server chrome as every guest page, with no hydrated
 * twin; the crossfade slideshow stays deferred in HomeLate.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <>
      <DemoModeBar variant="guest" locale={locale} />
      <SiteHeader locale={locale} />
      <main className="pb-0">{children}</main>
      <SiteFooter locale={locale} />
      {/* On home the phone Book bar waits below the screen until the hero's
          own booking widget has scrolled away. */}
      <MobileBookBar locale={locale} deferUntilScroll />
      <HomeLate locale={locale} />
      {/* Order modal host · CTA opens it via the shared window event. */}
      <DemoModal strings={getDemoStrings(locale)} />
      {/* Concierge · static server FAB (present in raw HTML) + scoped launcher */}
      {/* Compact on home · the hero booking widget shares this corner on a
          phone. FabHeroClearance expands it once the widget scrolls away. */}
      <ConciergeFabStatic label={t(locale, "cg.fab")} compact />
      <FabHeroClearance />
      <ConciergeMount lang={locale} messages={messagesFor(locale, ["cg.", "a11y."])} />
      <RouteProgress label={t(locale, "a11y.loadingPage")} />
    </>
  );
}
