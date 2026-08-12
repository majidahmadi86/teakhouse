"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { HeroSearchPillShell } from "@/components/hero/HeroSearchPillShell";
import { mountAfterLoad } from "@/lib/deferMount";

type Bundle = {
  Providers: ComponentType<{ children: ReactNode }>;
  Pill: ComponentType<{ className?: string }>;
};

/**
 * The full styled booking widget ships as an SSR shell (exact final geometry,
 * correct locale labels). The interactive pill hydrates on idle / interaction,
 * swapping in place with no layout shift · interactivity only, never content.
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

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void Promise.all([
        import("@/components/providers"),
        import("@/components/hero/HeroSearchPill"),
      ]).then(([prov, pill]) => {
        if (cancelled) return;
        setBundle({ Providers: prov.Providers, Pill: pill.HeroSearchPill });
      });
    };

    // The SSR shell is a pixel-identical twin of the interactive pill; the pill
    // (providers + day picker) mounts ~300ms after window load · no idle, no
    // interaction. The swap is invisible, so hydration timing cannot be seen.
    const cleanup = mountAfterLoad(load);
    return () => {
      cancelled = true;
      cleanup();
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
