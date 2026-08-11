"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { HeroSearchPillShell } from "@/components/hero/HeroSearchPillShell";

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

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("focusin", onInteract);
    };

    // Interactivity only · the SSR shell (correct geometry + locale) stays put
    // until the guest touches the widget, so the day-picker never loads on the
    // measured load path.
    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("focusin", onInteract, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("focusin", onInteract);
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
