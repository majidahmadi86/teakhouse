import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * JS-free entrance wrappers · fail-open by construction.
 *
 * Content is present and visible in the initial HTML; a one-shot CSS animation
 * (transform + opacity, defined in globals.css) plays on load. If JS never runs
 * the content is still fully visible · there is no opacity-0 resting state that
 * depends on hydration, and prefers-reduced-motion drops the animation to a
 * plain visible element. Same public API as the former framer version, so no
 * consumer changes are needed.
 */
export const premiumEase = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Accepted for API compatibility · CSS handles the offset. */
  y?: number;
  once?: boolean;
}) {
  const style: CSSProperties | undefined =
    delay > 0 ? { animationDelay: `${delay}s` } : undefined;
  return (
    <div className={cn("tkh-reveal", className)} style={style}>
      {children}
    </div>
  );
}

export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  /** Accepted for API compatibility · CSS handles the per-child stagger. */
  stagger?: number;
}) {
  return <div className={cn("tkh-reveal-stagger", className)}>{children}</div>;
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function MotionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("group tkh-lift", className)}>{children}</div>;
}

export function CurtainReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("tkh-curtain", className)}>{children}</div>;
}

export function ScaleIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("tkh-scale", className)}>{children}</div>;
}
