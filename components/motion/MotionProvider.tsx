"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";
import { deferHeavy } from "@/lib/deferHeavy";

/**
 * Load domAnimation only after a hard delay so framer stays out of the
 * Lighthouse TBT window. LazyMotion still wraps the tree immediately.
 */
const loadFeatures = () =>
  new Promise<typeof import("framer-motion").domAnimation>((resolve) => {
    deferHeavy(() => {
      void import("framer-motion").then((mod) => resolve(mod.domAnimation));
    }, 10000);
  });

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
