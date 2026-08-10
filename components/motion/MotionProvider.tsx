"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Async feature load · keeps framer off the critical path until first `m` use. */
const loadDomAnimation = () =>
  import("framer-motion").then((mod) => mod.domAnimation);

/**
 * Site-wide LazyMotion · loads the lightweight domAnimation feature bundle on demand.
 * Prefer `m` from framer-motion inside children (strict mode).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadDomAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
