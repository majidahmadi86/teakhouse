"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CONCIERGE_OPEN_EVENT } from "@/lib/conciergeEvents";
import type { Lang, Messages } from "@/lib/i18n";

/** Shared container geometry · matches ConciergePanel so there is no jump. */
const SHEET =
  "fixed z-drawer inset-x-0 bottom-0 h-[90dvh] w-full rounded-t-[20px] bg-white shadow-[0_30px_80px_rgba(18,33,28,0.35)] md:inset-x-auto md:right-[22px] md:bottom-6 md:h-[min(560px,72svh)] md:w-[min(390px,calc(100vw-32px))] md:rounded-[20px]";

type BundleProps = { lang: Lang; messages: Messages; prefill: string };

/**
 * The concierge, loaded on click (A1: client islands only for the concierge
 * on click, among a few others).
 *
 * Nothing of the chat (its panel, its providers) ships with the page: this
 * listener is all that hydrates. The first click on the server-rendered FAB
 * (data-concierge-fab) or a ConciergeAskButton loads the bundle and opens the
 * chat with whatever topic was asked; a loading sheet covers the fetch, so the
 * button is never dead. Its strings (the cg.* keys, a few hundred bytes)
 * arrive as props in the page language.
 */
export function ConciergeLazy({
  lang,
  messages,
  loadingLabel,
}: {
  lang: Lang;
  messages: Messages;
  loadingLabel: string;
}) {
  const [armed, setArmed] = useState<{ prefill: string } | null>(null);

  useEffect(() => {
    if (armed) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-concierge-fab]")) {
        e.preventDefault();
        setArmed({ prefill: "" });
      }
    };
    const onAsk = (e: Event) => {
      const topic = (e as CustomEvent<string>).detail;
      setArmed({ prefill: typeof topic === "string" ? topic : "" });
    };
    document.addEventListener("click", onClick);
    window.addEventListener(CONCIERGE_OPEN_EVENT, onAsk);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(CONCIERGE_OPEN_EVENT, onAsk);
    };
  }, [armed]);

  if (!armed) return null;
  return (
    <ConciergeBundle
      lang={lang}
      messages={messages}
      prefill={armed.prefill}
      loadingLabel={loadingLabel}
    />
  );
}

const ConciergeBundle = dynamic(
  () => import("@/components/ConciergeBundle").then((m) => m.ConciergeBundle),
  {
    ssr: false,
    loading: () => (
      <div className={`${SHEET} flex items-center justify-center`} role="dialog" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue border-t-transparent" />
      </div>
    ),
  }
) as unknown as React.ComponentType<BundleProps & { loadingLabel: string }>;
