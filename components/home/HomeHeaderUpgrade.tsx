"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

const LATE_MS = 20000;

/**
 * Shell first · full Header (Logo + RoomsMegaMenu + lang/currency) after
 * interaction or LATE_MS. Hovering nav also triggers upgrade so mega-menu works.
 */
export function HomeHeaderUpgrade({ shell }: { shell: ReactNode }) {
  const [header, setHeader] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let loading = false;

    const load = () => {
      if (loading || cancelled) return;
      loading = true;
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
      window.removeEventListener("mouseover", onNavHover);
    };

    const onNavHover = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("header")) load();
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("mouseover", onNavHover, { passive: true });
    timeoutId = window.setTimeout(load, LATE_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("mouseover", onNavHover);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return <>{header ?? shell}</>;
}
