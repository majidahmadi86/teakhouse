"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { mountAfterLoad } from "@/lib/deferMount";

/**
 * SSR HeaderShell (correct locale, pixel-identical to the hydrated Header) then
 * the full interactive Header (mega-menu, lang, currency) mounts ~300ms after
 * window load · no idle, no interaction. The shell looks identical, so the
 * upgrade is invisible and never gates content.
 */
export function HomeHeaderUpgrade({ shell }: { shell: ReactNode }) {
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
        }>;
        const Header = hdr.Header as ComponentType;
        setHeader(
          <Providers>
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
  }, []);

  return <>{header ?? shell}</>;
}
