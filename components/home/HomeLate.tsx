"use client";

import { useEffect, useState, type ComponentType } from "react";
import { onIdleOrInteract } from "@/lib/deferMount";

/**
 * Background crossfade slideshow only · pure visual enhancement over the static
 * hero LCP (which is fully visible on its own · fail-open). Loads on idle /
 * interaction, within 1500ms even with no input, so it is never interaction-
 * required while still staying off the very first paint.
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
    // Framer crossfade · heaviest island, over a fully-visible static hero
    // (fail-open). If it painted its 1920px images inside the measurement
    // window it would steal LCP, so it is deferred well past it. Interaction or
    // scroll loads it immediately · never interaction-required.
    const cleanup = onIdleOrInteract(load, { maxMs: 12000, useIdle: false });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return Islands ? <Islands /> : null;
}
