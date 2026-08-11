"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const HeroSlideshow = dynamic(
  () =>
    import("@/components/hero/HeroSlideshow").then((m) => m.HeroSlideshow),
  { ssr: false }
);

/** Background crossfade portalled behind the hero · pure enhancement. */
export function HomeDeferredIslands() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("tkh-hero-slideshow"));
  }, []);

  if (!portalTarget) return null;
  return createPortal(<HeroSlideshow lcp={null} />, portalTarget);
}
