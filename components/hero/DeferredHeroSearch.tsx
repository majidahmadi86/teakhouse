"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { HeroSearchPillShell } from "@/components/hero/HeroSearchPillShell";

type Bundle = {
  Providers: ComponentType<{ children: ReactNode }>;
  Pill: ComponentType<{ className?: string }>;
};

/**
 * Shows the full styled booking widget immediately (SSR shell).
 * Hydrates HeroSearchPill on first interaction or after LATE_MS.
 */
export function DeferredHeroSearch({
  checkInLabel,
  guestLabel,
  checkRatesLabel,
  tonightLabel,
}: {
  checkInLabel: string;
  guestLabel?: string;
  checkRatesLabel?: string;
  tonightLabel?: string;
}) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const LATE_MS = 20000;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const load = () => {
      void Promise.all([
        import("@/components/providers"),
        import("@/components/hero/HeroSearchPill"),
      ]).then(([prov, pill]) => {
        if (cancelled) return;
        setBundle({
          Providers: prov.Providers,
          Pill: pill.HeroSearchPill,
        });
      });
    };

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("focusin", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("focusin", onInteract, { once: true });
    timeoutId = window.setTimeout(load, LATE_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("focusin", onInteract);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!bundle) {
    return (
      <HeroSearchPillShell
        checkInLabel={checkInLabel}
        guestLabel={guestLabel}
        checkRatesLabel={checkRatesLabel}
        tonightLabel={tonightLabel}
      />
    );
  }

  const { Providers, Pill } = bundle;
  return (
    <Providers>
      <Pill />
    </Providers>
  );
}
