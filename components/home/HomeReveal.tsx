import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * JS-free entrance wrappers for the server-rendered below-fold.
 * Content is visible in the initial HTML (SSR); a one-shot CSS animation
 * plays on load. No framer, no hooks · safe inside RSC and honours
 * prefers-reduced-motion (see globals.css .tkh-reveal*).
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("tkh-reveal", className)}>{children}</div>;
}

export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("tkh-reveal-stagger", className)}>{children}</div>
  );
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
