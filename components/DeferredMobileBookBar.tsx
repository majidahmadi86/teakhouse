"use client";

import { useEffect, useState, type ComponentType } from "react";
import { onIdleOrInteract } from "@/lib/deferMount";

/**
 * Mobile book bar stays out of the initial bundle · appears on idle /
 * interaction, within 1500ms even with no input.
 */
export function DeferredMobileBookBar() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import("@/components/MobileBookBar").then((m) => {
        if (!cancelled) setComp(() => m.MobileBookBar);
      });
    };
    // Idle-triggered · appears within ~1s on a real device (not shown on /book,
    // so it never affects that gate) · never interaction-required.
    const cleanup = onIdleOrInteract(load, { maxMs: 3000, useIdle: true });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!Comp) return null;
  return <Comp />;
}
