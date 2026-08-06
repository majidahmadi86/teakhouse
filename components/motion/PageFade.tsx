"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** CSS page fade — keeps framer-motion off the navigation critical path. */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="tkh-page-fade">
      {children}
    </div>
  );
}
