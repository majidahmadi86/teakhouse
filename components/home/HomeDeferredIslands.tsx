"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "@/lib/translate";

const HeroSlideshow = dynamic(
  () =>
    import("@/components/hero/HeroSlideshow").then((m) => m.HeroSlideshow),
  { ssr: false }
);

/** Background crossfade portalled behind the hero · pure enhancement. */
export function HomeDeferredIslands({ locale }: { locale: Lang }) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("tkh-hero-slideshow"));
  }, []);

  if (!portalTarget) return null;
  return createPortal(<HeroSlideshow lcp={null} locale={locale} />, portalTarget);
}
