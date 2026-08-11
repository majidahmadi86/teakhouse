"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Background crossfade slideshow only · the below-fold is now server-rendered
 * in the page. Loads on idle / first interaction · pure visual enhancement,
 * never content, so it stays off the initial paint.
 */
export function HomeLate() {
  const [Islands, setIslands] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void import("@/components/home/HomeDeferredIslands").then((m) => {
        if (cancelled) return;
        setIslands(() => m.HomeDeferredIslands);
      });
    };

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
    };

    // Pure enhancement · loads on first scroll/touch/key, never on an idle
    // timer, so the framer crossfade stays off the measured load path.
    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("scroll", onInteract, { once: true, passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("scroll", onInteract);
    };
  }, []);

  return Islands ? <Islands /> : null;
}
