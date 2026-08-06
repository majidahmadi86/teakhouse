"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Async feature bundle — keeps domAnimation off the critical path. */
const loadFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
