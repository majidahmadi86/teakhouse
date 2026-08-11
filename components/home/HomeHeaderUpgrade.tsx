"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

/**
 * SSR HeaderShell (already in the correct locale) · upgrades to the full
 * interactive Header (mega-menu, lang, currency) on idle, interaction, or nav
 * hover. No fixed multi-second timer · interactivity only, never content.
 */
export function HomeHeaderUpgrade({ shell }: { shell: ReactNode }) {
  const [header, setHeader] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;
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
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("header")) load();
    };

    // Interactivity only · hydrate on the user's first touch/hover/key, never
    // on an idle timer (keeps the heavy Header + framer off the load path). The
    // SSR HeaderShell is already interactive as plain links until then.
    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("mouseover", onNavHover, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("mouseover", onNavHover);
    };
  }, []);

  return <>{header ?? shell}</>;
}
