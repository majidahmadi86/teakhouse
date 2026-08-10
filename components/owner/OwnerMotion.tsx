"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { premiumEase } from "@/components/motion/Reveal";

const rise = {
  duration: 0.4,
  ease: premiumEase,
};

/** Owner panel card entrance · 12px rise, 0.4s, no bounce. */
export function OwnerStagger({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </m.div>
  );
}

export function OwnerRise({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: rise },
      }}
    >
      {children}
    </m.div>
  );
}
