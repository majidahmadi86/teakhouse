"use client";

import { useEffect, useState, type ComponentType } from "react";

type ConciergeProps = { offsetForBookBar?: boolean; onBook?: boolean };

/**
 * Keeps Concierge (and FAB clearance observers) out of the initial bundle.
 * Loads on first pointer/key interaction or requestIdleCallback.
 */
export function DeferredConcierge({
  offsetForBookBar = true,
  onBook = false,
}: ConciergeProps) {
  const [Comp, setComp] = useState<ComponentType<ConciergeProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const load = () => {
      void import("@/components/Concierge").then((m) => {
        if (!cancelled) setComp(() => m.Concierge);
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

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 12000 });
    } else {
      timeoutId = window.setTimeout(load, 10000);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!Comp) return null;
  return <Comp offsetForBookBar={offsetForBookBar} onBook={onBook} />;
}
