"use client";

import type { ReactNode } from "react";

/**
 * Passthrough · framer stays out of the root provider graph.
 * Deferred islands (SearchPill, Reveal, Crossfade) import framer in their own chunks.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return children;
}
