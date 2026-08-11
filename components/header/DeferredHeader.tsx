"use client";

import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

/**
 * Keeps the full Header (lucide, drawer, auth, mega-menu) out of the
 * initial home hydration window. Shell HTML paints immediately.
 */
export function DeferredHeader({ shell }: { shell: ReactNode }) {
  const [Header, setHeader] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const load = () => {
      void import("@/components/Header").then((m) => {
        if (!cancelled) setHeader(() => m.Header);
      });
    };

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 12000 });
    } else {
      timeoutId = window.setTimeout(load, 10000);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!Header) return <>{shell}</>;
  return <Header />;
}
