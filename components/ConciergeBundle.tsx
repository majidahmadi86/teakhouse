"use client";

import { useEffect } from "react";
import { ConciergeLauncher } from "@/components/ConciergeLauncher";
import { ConciergeProvider, useConcierge } from "@/components/providers";
import { CONCIERGE_OPEN_EVENT } from "@/lib/conciergeEvents";
import { I18nProvider, type Lang, type Messages } from "@/lib/i18n";

/** Opens the chat once on mount, then on every later "ask" request. */
function Opener({ prefill }: { prefill: string }) {
  const { openConcierge } = useConcierge();
  useEffect(() => {
    openConcierge(prefill);
    const onAsk = (e: Event) => {
      const topic = (e as CustomEvent<string>).detail;
      openConcierge(typeof topic === "string" ? topic : "");
    };
    window.addEventListener(CONCIERGE_OPEN_EVENT, onAsk);
    return () => window.removeEventListener(CONCIERGE_OPEN_EVENT, onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** The chat with its own language and concierge context · loaded on demand. */
export function ConciergeBundle({
  lang,
  messages,
  prefill,
}: {
  lang: Lang;
  messages: Messages;
  prefill: string;
}) {
  return (
    <I18nProvider initialLang={lang} messages={messages}>
      <ConciergeProvider>
        <Opener prefill={prefill} />
        <ConciergeLauncher />
      </ConciergeProvider>
    </I18nProvider>
  );
}
