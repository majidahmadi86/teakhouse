"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type Bundle = {
  Providers: ComponentType<{ children: ReactNode }>;
  Islands: ComponentType;
};

/**
 * Below-fold + slideshow · loads with Providers so useI18n is safe.
 * Keeps the zero-provider LCP path intact until idle / interaction.
 */
export function HomeLate() {
  const [bundle, setBundle] = useState<Bundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
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

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 20000 });
    } else {
      timeoutId = window.setTimeout(load, 18000);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
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
