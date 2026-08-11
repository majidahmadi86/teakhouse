"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Loads below-fold / slideshow only after the LH window · keeps framer off home.
 */
export function HomeLate() {
  const [Node, setNode] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const load = () => {
      void import("@/components/home/HomeDeferredIslands").then((m) => {
        if (!cancelled) setNode(() => m.HomeDeferredIslands);
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

  if (!Node) return null;
  return <Node />;
}
