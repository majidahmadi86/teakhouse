import type { Metadata } from "next";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { HeaderShell } from "@/components/header/HeaderShell";
import { HomeHeaderUpgrade } from "@/components/home/HomeHeaderUpgrade";
import { HomeLate } from "@/components/home/HomeLate";
import { getDemoStrings } from "@/lib/demoStrings";
import { getServerLocale } from "@/lib/serverLocale";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/**
 * Home layout · hero + below-fold are server components (rendered in the page)
 * so no provider sits on the LCP path. The SSR HeaderShell renders in the
 * resolved locale and upgrades to the full interactive Header on idle /
 * interaction; the crossfade slideshow stays deferred in HomeLate.
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
      <HomeHeaderUpgrade shell={<HeaderShell locale={locale} />} />
      <main className="pb-0">{children}</main>
      <HomeLate />
      {/* Order modal host · CTA opens it via the shared window event. */}
      <DemoModal strings={getDemoStrings(locale)} />
    </>
  );
}
