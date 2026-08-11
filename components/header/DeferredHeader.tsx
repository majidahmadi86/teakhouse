"use client";

import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

const LATE_MS = 15000;

/**
 * Shell first · full Header on interaction or after LATE_MS.
 * No requestIdleCallback · idle fires too early on quiet pages.
 */
export function DeferredHeader({ shell }: { shell: ReactNode }) {
  const [Header, setHeader] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const load = () => {
      void import("@/components/Header").then((m) => {
        if (!cancelled) setHeader(() => m.Header);
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

  if (!Header) return <>{shell}</>;
  return <Header />;
}
