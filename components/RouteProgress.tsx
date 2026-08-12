"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * v14 · Instant response to a nav click, without giving up JS-disabled pages.
 *
 * The obvious tool here is loading.tsx, and it was tried and removed. A
 * loading.tsx wraps the route in a Suspense boundary, so Next streams the
 * skeleton first and swaps the real content in with an inline script. With
 * scripting off that swap never runs: the page keeps the skeleton and the real
 * content stays in a display:none wrapper. Every guest route failed the
 * JS-disabled bar that way, which is a worse outcome than a slow-feeling click.
 *
 * So the feedback lives entirely on the client, where it is the only place it
 * can matter · a guest with no JavaScript gets a full page load from the
 * browser, which has its own progress indicator. A delegated click listener
 * catches internal links, a slim branded bar animates immediately, and the bar
 * clears when the pathname changes.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      const target = link.getAttribute("target");
      if (!href || target === "_blank") return;
      // Internal, and actually going somewhere else.
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (href.split("?")[0].split("#")[0] === pathname) return;

      setActive(true);
      // A navigation that never lands (blocked, cancelled) must not leave the
      // bar running forever.
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), 8000);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  // The new route is on screen · done.
  useEffect(() => {
    setActive(false);
    if (timer.current) clearTimeout(timer.current);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="fixed inset-x-0 top-0 z-modal h-[3px] overflow-hidden bg-transparent"
    >
      <div className="tkh-route-bar h-full w-full bg-gradient-to-r from-blue via-gold to-blue" />
    </div>
  );
}
