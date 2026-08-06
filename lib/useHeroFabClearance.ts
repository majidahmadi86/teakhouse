"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/lib/useMediaQuery";

/**
 * On the home hero (mobile): bottom offset in px so the FAB clears the
 * search-pill action zone by ≥12px. Null once the hero leaves the viewport
 * (or on desktop / other routes) — callers fall back to the book-bar offset.
 */
export function useHeroFabClearance(): number | null {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [clearance, setClearance] = useState<number | null>(null);

  useEffect(() => {
    if (pathname !== "/" || !isMobile) {
      setClearance(null);
      return;
    }

    function update() {
      const hero = document.getElementById("tkh-hero");
      const actions = document.getElementById("tkh-hero-actions");
      if (!hero) {
        setClearance(null);
        return;
      }
      const bottom = hero.getBoundingClientRect().bottom;
      const overHero = bottom > 48;
      if (!overHero || !actions) {
        setClearance(null);
        return;
      }
      const actionsTop = actions.getBoundingClientRect().top;
      const px = Math.max(76, window.innerHeight - actionsTop + 12);
      setClearance(px);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    const actions = document.getElementById("tkh-hero-actions");
    if (actions && ro) ro.observe(actions);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [pathname, isMobile]);

  return clearance;
}
