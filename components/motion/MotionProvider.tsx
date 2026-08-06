"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Load domAnimation only after the browser is idle so framer stays out of
 * the Lighthouse TBT / bootup window. LazyMotion still wraps the tree
 * immediately (no remount when features arrive).
 */
const loadFeatures = () =>
  new Promise<typeof import("framer-motion").domAnimation>((resolve) => {
    const start = () => {
      void import("framer-motion").then((mod) => resolve(mod.domAnimation));
    };
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(start, { timeout: 10000 });
      return;
    }
    setTimeout(start, 8000);
  });

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
