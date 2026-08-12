"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { mountAfterLoad } from "@/lib/deferMount";

/**
 * SSR shell first (pixel-identical to the hydrated Header · plain links) then
 * the full interactive Header mounts ~300ms after window load · no idle, no
 * interaction. The shell is visually identical, so the upgrade is invisible.
 */
export function DeferredHeader({ shell }: { shell: ReactNode }) {
  const [Header, setHeader] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import("@/components/Header").then((m) => {
        if (!cancelled) setHeader(() => m.Header);
      });
    };
    // Mounts ~300ms after window load · deterministic, never input-triggered.
    const cleanup = mountAfterLoad(load);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!Header) return <>{shell}</>;
  return <Header />;
}
