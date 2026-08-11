"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

const LATE_MS = 15000;

/** Static shell first · full Header after LCP window / interaction. */
export function HomeHeaderUpgrade({ shell }: { shell: ReactNode }) {
  const [header, setHeader] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

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

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    timeoutId = window.setTimeout(load, LATE_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return <>{header ?? shell}</>;
}
