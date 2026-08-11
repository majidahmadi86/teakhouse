"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const HeroSearchPill = dynamic(
  () =>
    import("@/components/hero/HeroSearchPill").then((mod) => mod.HeroSearchPill),
  {
    ssr: false,
    loading: () => <SearchPillShell />,
  }
);

const HeroSlideshow = dynamic(
  () =>
    import("@/components/hero/HeroSlideshow").then((m) => m.HeroSlideshow),
  { ssr: false }
);

const HomeBelowFold = dynamic(
  () =>
    import("@/components/home/HomeBelowFold").then((mod) => mod.HomeBelowFold),
  { ssr: false }
);

function SearchPillShell() {
  return (
    <div
      className="h-14 w-full rounded-full bg-white shadow-[0_16px_44px_rgba(10,46,92,.20)] md:h-[72px] md:max-w-[720px]"
      aria-hidden
    />
  );
}

function useLateArm(timeoutMs: number) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const arm = () => {
      if (!cancelled) setReady(true);
    };
    const onInteract = () => {
      arm();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(arm, { timeout: timeoutMs });
    } else {
      timeoutId = window.setTimeout(arm, Math.max(0, timeoutMs - 1000));
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [timeoutMs]);

  return ready;
}

/** Search pill only · placeholder until idle / interaction. */
export function DeferredSearchPill() {
  const ready = useLateArm(10000);
  if (!ready) return <SearchPillShell />;
  return <HeroSearchPill />;
}

/** Crossfade + below-fold · well past the mobile LH window. */
export function HomeDeferredIslands() {
  const ready = useLateArm(12000);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("tkh-hero-slideshow"));
  }, []);

  if (!ready) return null;

  return (
    <>
      {portalTarget
        ? createPortal(<HeroSlideshow lcp={null} />, portalTarget)
        : null}
      <HomeBelowFold />
    </>
  );
}
