"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type Bundle = {
  Providers: ComponentType<{ children: ReactNode }>;
  Islands: ComponentType;
};

/** Min delay so LH mobile window never pulls i18n/framer. */
const LATE_MS = 15000;

/**
 * Below-fold + slideshow · loads with Providers so useI18n is safe.
 * Interaction or fixed delay only · no early requestIdleCallback.
 */
export function HomeLate() {
  const [bundle, setBundle] = useState<Bundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const load = () => {
      void Promise.all([
        import("@/components/providers"),
        import("@/components/home/HomeDeferredIslands"),
      ]).then(([prov, islands]) => {
        if (cancelled) return;
        setBundle({
          Providers: prov.Providers,
          Islands: islands.HomeDeferredIslands,
        });
      });
    };

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("scroll", onInteract, {
      once: true,
      passive: true,
    });

    timeoutId = window.setTimeout(load, LATE_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!bundle) return null;
  const { Providers, Islands } = bundle;
  return (
    <Providers>
      <Islands />
    </Providers>
  );
}
