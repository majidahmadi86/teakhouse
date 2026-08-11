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
    const cleanup = onIdleOrInteract(load, { maxMs: 12000, useIdle: false });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!Comp) return null;
  return <Comp />;
}
