"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type LogoProps = {
  size?: number;
  className?: string;
  showTag?: boolean;
  light?: boolean;
  tagline?: string;
  children?: ReactNode;
};

export function Logo({
  size = 24,
  className,
  showTag = true,
  light = false,
  tagline,
  children,
}: LogoProps) {
  const { t } = useI18n();
  const tag = children ?? tagline ?? t("brand.tag");

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-gold"
        width={size}
        height={size}
        aria-hidden
      >
        <path d="M10 30 L32 12 L54 30" />
        <path d="M18 30 L32 19 L46 30" />
        <path d="M22 34 V48 M32 34 V48 M42 34 V48" />
        <path d="M10 56 q5.5 -5 11 0 t11 0 t11 0 t11 0" />
      </svg>
      <div className="min-w-0">
        <div
          className={cn(
            "font-display text-[1.05rem] font-semibold leading-none tracking-[.04em]",
            light ? "text-white" : "text-ink"
          )}
        >
          THE TEAK HOUSE
        </div>
        {showTag ? (
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-gold">
            {tag}
          </div>
        ) : null}
      </div>
    </div>
  );
}
