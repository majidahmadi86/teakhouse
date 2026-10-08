import type { Metadata } from "next";
import { ConciergeFabStatic } from "@/components/ConciergeFabStatic";
import { ConciergeLazy } from "@/components/ConciergeLazy";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { getDemoStrings } from "@/lib/demoStrings";
import { t } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { CONCIERGE_KEYS, messagesFor } from "@/lib/locales";
import { GuestShell } from "./GuestShell";
import { RouteProgress } from "@/components/RouteProgress";

export const metadata: Metadata = {};

/**
 * Non-home guest routes · server chrome, no provider tree. The client
 * providers (language strings, guest account, concierge context) are mounted
 * only where a page needs them: /book and /account in their own layouts, the
 * room page's booking rail, and the concierge, which brings its own when it is
 * first opened. A page like /rooms ships no dictionary and no provider code.
 */
export default function GuestLayout({
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
      <DemoModal strings={getDemoStrings(locale)}>
        <GuestShell locale={locale}>{children}</GuestShell>
      </DemoModal>
      {/* Concierge · static server FAB (present in raw HTML), chat on click */}
      <ConciergeFabStatic label={t(locale, "cg.fab")} />
      <ConciergeLazy
        lang={locale}
        messages={messagesFor(locale, CONCIERGE_KEYS)}
        loadingLabel={t(locale, "cg.name")}
      />
      <RouteProgress label={t(locale, "a11y.loadingPage")} />
    </>
  );
}
