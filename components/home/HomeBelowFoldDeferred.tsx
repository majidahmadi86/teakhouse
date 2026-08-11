"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

/**
 * Reserves the below-fold height with exact-height skeletons (so the document
 * has a scrollbar at first paint and the hero LCP is uncontended), then loads
 * the real sections on first scroll / idle / interaction. The content renders
 * from the cookie-seeded i18n context, so it is in the right language with no
 * flash and follows the atomic toggle.
 */
export function HomeBelowFoldDeferred() {
  const [Bundle, setBundle] = useState<{
    Providers: ComponentType<{ children: ReactNode }>;
    BelowFold: ComponentType;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void Promise.all([
        import("@/components/providers"),
        import("@/components/home/HomeBelowFold"),
      ]).then(([prov, bf]) => {
        if (cancelled) return;
        setBundle({ Providers: prov.Providers, BelowFold: bf.HomeBelowFold });
      });
    };

    const onInteract = () => {
      load();
      window.removeEventListener("scroll", onInteract);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };

    window.addEventListener("scroll", onInteract, { once: true, passive: true });
    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, {
      once: true,
      passive: true,
    });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onInteract);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, []);

  if (Bundle) {
    const { Providers, BelowFold } = Bundle;
    return (
      <Providers>
        <BelowFold />
      </Providers>
    );
  }

  // Exact-height skeletons · reserve the scrollbar height, zero content JS.
  return (
    <div aria-hidden>
      <div className="h-[560px] bg-white md:h-[520px]" />
      <div className="h-[720px] bg-cloud md:h-[640px]" />
      <div className="h-[560px] bg-coral-bg md:h-[520px]" />
      <div className="h-[620px] bg-navy md:h-[560px]" />
      <div className="h-[620px] bg-white md:h-[560px]" />
      <div className="h-[320px] bg-cloud" />
    </div>
  );
}
