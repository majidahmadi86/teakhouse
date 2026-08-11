"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeHeroThaiOverlayInner = dynamic(
  () =>
    import("@/components/home/HomeHeroThaiOverlayInner").then(
      (m) => m.HomeHeroThaiOverlayInner
    ),
  { ssr: false }
);

/**
 * EN (Lighthouse default) never downloads the Thai hero overlay chunk.
 */
export function HomeHeroThaiGate() {
  const [th, setTh] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("tkh-lang") === "th") setTh(true);
    } catch {
      /* ignore */
    }
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "th") setTh(true);
      if (detail === "en") setTh(false);
    };
    window.addEventListener("tkh:lang", onLang as EventListener);
    return () =>
      window.removeEventListener("tkh:lang", onLang as EventListener);
  }, []);

  if (!th) return null;
  return <HomeHeroThaiOverlayInner />;
}
