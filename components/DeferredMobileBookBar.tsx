"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Mobile book bar stays out of the initial home bundle.
 * Loads on interaction or late idle (after LH TBT window).
 */
export function DeferredMobileBookBar() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const load = () => {
      void import("@/components/MobileBookBar").then((m) => {
        if (!cancelled) setComp(() => m.MobileBookBar);
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
      idleId = window.requestIdleCallback(load, { timeout: 10000 });
    } else {
      timeoutId = window.setTimeout(load, 9000);
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
  return <Comp />;
}
