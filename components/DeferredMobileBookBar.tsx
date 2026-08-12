"use client";

import { useEffect, useState, type ComponentType } from "react";
import { mountAfterLoad } from "@/lib/deferMount";

/**
 * Mobile book bar stays out of the initial bundle · mounts ~300ms after window
 * load · no idle, no interaction. It is a bottom sticky bar that is off-screen
 * (translated down) until the hero is scrolled past, so it is not visible in
 * the no-scroll acceptance frames · appearance is unchanged by hydration.
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
    const cleanup = mountAfterLoad(load);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!Comp) return null;
  return <Comp />;
}
