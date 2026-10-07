"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { mountAfterLoad } from "@/lib/deferMount";
import type { Lang, Messages } from "@/lib/i18n";

/**
 * SSR HeaderShell (correct locale, pixel-identical to the hydrated Header) then
 * the full interactive Header (mega-menu, lang, currency) mounts ~300ms after
 * window load · no idle, no interaction. The shell looks identical, so the
 * upgrade is invisible and never gates content.
 */
export function HomeHeaderUpgrade({
  shell,
  lang,
  messages,
}: {
  shell: ReactNode;
  lang: Lang;
  messages: Messages;
}) {
  const [header, setHeader] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void Promise.all([
        import("@/components/providers"),
        import("@/components/Header"),
      ]).then(([prov, hdr]) => {
        if (cancelled) return;
        const Providers = prov.Providers as ComponentType<{
          children: ReactNode;
          initialLang: Lang;
          messages: Messages;
        }>;
        const Header = hdr.Header as ComponentType;
        setHeader(
          <Providers initialLang={lang} messages={messages}>
            <Header />
          </Providers>
        );
      });
    };

    // Mounts ~300ms after window load · deterministic, never input-triggered.
    const cleanup = mountAfterLoad(load);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [lang, messages]);

  return <>{header ?? shell}</>;
}
