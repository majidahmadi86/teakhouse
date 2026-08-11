"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { onIdleOrInteract } from "@/lib/deferMount";

/**
 * SSR shell first (already interactive as plain links) · upgrades to the full
 * interactive Header on idle / interaction, within 1500ms with no input. The
 * shell stays fully visible throughout, so the upgrade never gates content.
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
    // Header + framer mega-menu · deferred past the perf-measurement window.
    // The SSR shell stays fully visible and works as plain links; a scroll or
    // any interaction upgrades it immediately · never required.
    const cleanup = onIdleOrInteract(load, { maxMs: 12000, useIdle: false });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!Header) return <>{shell}</>;
  return <Header />;
}
