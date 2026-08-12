"use client";

import { useEffect, useState, type ComponentType } from "react";
import { mountAfterLoad } from "@/lib/deferMount";

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
    // Background crossfade over the always-visible static hero LCP · a pure
    // enhancement. Mounts ~300ms after window load · no idle, no interaction.
    // (Its crossfade region is the ONE area allowed to differ across frames.)
    const cleanup = mountAfterLoad(load);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return Islands ? <Islands /> : null;
}
