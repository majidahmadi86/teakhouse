"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ConciergeFab } from "@/components/ConciergeFab";
import { useConcierge } from "@/components/providers";

const ConciergePanel = dynamic(
  () => import("@/components/ConciergePanel").then((m) => m.ConciergePanel),
  { ssr: false }
);

/**
 * FAB renders immediately (CSS-only). Chat panel mounts after idle
 * or on first open — never on the critical path.
 */
export function Concierge({ offsetForBookBar = true }: { offsetForBookBar?: boolean }) {
  const { isOpen } = useConcierge();
  const [panelReady, setPanelReady] = useState(false);

  const ensurePanel = useCallback(() => setPanelReady(true), []);

  useEffect(() => {
    if (isOpen) {
      setPanelReady(true);
      return;
    }
    let cancelled = false;
    const load = () => {
      if (!cancelled) setPanelReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(load, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [isOpen]);

  return (
    <>
      <ConciergeFab offsetForBookBar={offsetForBookBar} onOpen={ensurePanel} />
      {panelReady ? <ConciergePanel offsetForBookBar={offsetForBookBar} /> : null}
    </>
  );
}

export { ConciergeAskButton } from "@/components/ConciergeFab";
