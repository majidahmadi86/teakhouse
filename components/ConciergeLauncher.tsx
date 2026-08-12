"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ConciergeProvider, useConcierge } from "@/components/providers";
import { I18nProvider, useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Shared container geometry · matches ConciergePanel so there is no jump. */
const SHEET =
  "fixed z-drawer inset-x-0 bottom-0 h-[90dvh] w-full rounded-t-[20px] bg-white shadow-[0_30px_80px_rgba(18,33,28,0.35)] md:inset-x-auto md:right-[22px] md:bottom-6 md:h-[min(560px,72svh)] md:w-[min(390px,calc(100vw-32px))] md:rounded-[20px]";

/** Loading sheet · shown the instant the FAB is clicked, until the chat panel
 *  chunk mounts. Never a dead button. */
function ConciergeLoading() {
  const { t } = useI18n();
  return (
    <div
      className={cn(SHEET, "flex flex-col items-center justify-center gap-4")}
      role="dialog"
      aria-label="Concierge chat"
      aria-busy="true"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue border-t-transparent" />
      <p className="text-sm font-semibold text-sub">{t("cg.name")}</p>
    </div>
  );
}

const ConciergePanel = dynamic(
  () => import("@/components/ConciergePanel").then((m) => m.ConciergePanel),
  { ssr: false, loading: () => <ConciergeLoading /> }
);

/**
 * Enhances the static server FAB (data-concierge-fab). Attaches a delegated
 * click listener the moment it hydrates, opens the chat on click, and mounts
 * the deferred panel · the dynamic `loading` sheet covers the chunk fetch. Also
 * reacts to isOpen from context (ConciergeAskButton elsewhere opens the chat
 * without the FAB). The FAB itself is static HTML and never depends on this.
 */
export function ConciergeLauncher() {
  const { isOpen, openConcierge } = useConcierge();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-concierge-fab]")) {
        e.preventDefault();
        setArmed(true);
        openConcierge();
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openConcierge]);

  return armed || isOpen ? <ConciergePanel /> : null;
}

/**
 * Self-contained mount for layouts without the full Providers tree (home).
 * Provides its own i18n + concierge context so the panel works standalone.
 */
export function ConciergeMount({ lang }: { lang: Lang }) {
  return (
    <I18nProvider initialLang={lang}>
      <ConciergeProvider>
        <ConciergeLauncher />
      </ConciergeProvider>
    </I18nProvider>
  );
}
