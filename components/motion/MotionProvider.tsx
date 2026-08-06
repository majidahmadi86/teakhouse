"use client";

import type { ReactNode } from "react";

/**
 * Passthrough — do not import framer-motion here.
 * Motion components load framer only inside deferred/route chunks.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return children;
}
