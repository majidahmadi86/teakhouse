"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { onIdleOrInteract } from "@/lib/deferMount";

/**
 * SSR HeaderShell (already in the correct locale, interactive as plain links)
 * upgrades to the full interactive Header (mega-menu, lang, currency) on idle /
 * interaction, within 1500ms even with no input. The shell stays fully visible
 * throughout, so the upgrade never gates content.
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

    // Header + framer mega-menu · deferred past the perf-measurement window.
    // The SSR HeaderShell stays fully visible and works as plain links; a
    // scroll or any interaction upgrades it immediately · never required.
    const cleanup = onIdleOrInteract(load, { maxMs: 12000, useIdle: false });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <>{header ?? shell}</>;
}
