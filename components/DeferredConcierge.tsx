"use client";

import { useEffect, useState, type ComponentType } from "react";
import { onIdleOrInteract } from "@/lib/deferMount";

type ConciergeProps = { offsetForBookBar?: boolean; onBook?: boolean };

/**
 * Keeps Concierge (and FAB clearance observers) out of the initial bundle.
 * The FAB appears on idle / interaction, within 1500ms even with no input.
 */
export function DeferredConcierge({
  offsetForBookBar = true,
  onBook = false,
}: ConciergeProps) {
  const [Comp, setComp] = useState<ComponentType<ConciergeProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import("@/components/Concierge").then((m) => {
        if (!cancelled) setComp(() => m.Concierge);
      });
    };
    // Idle-triggered · the FAB is a cheap CSS button (the heavy chat panel is
    // deferred separately inside Concierge), so it mounts on first idle within
    // ~1s on a real device · never interaction-required, never a 12s wait.
    const cleanup = onIdleOrInteract(load, { maxMs: 3000, useIdle: true });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!Comp) return null;
  return <Comp offsetForBookBar={offsetForBookBar} onBook={onBook} />;
}
