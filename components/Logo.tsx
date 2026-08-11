"use client";

import type { ReactNode } from "react";
import { LogoMark } from "@/components/LogoMark";
import { hotelConfig } from "@/config/hotel.config";

type LogoProps = {
  size?: number;
  className?: string;
  showTag?: boolean;
  light?: boolean;
  tagline?: string;
  children?: ReactNode;
};

/** Client wrapper · same v7 glyph + wordmark as LogoMark. */
export function Logo({
  size = 24,
  className,
  showTag = true,
  light = false,
  tagline,
  children,
}: LogoProps) {
  const tag =
    (typeof children === "string" ? children : undefined) ??
    tagline ??
    hotelConfig.tagline.en;

  return (
    <LogoMark
      size={size}
      className={className}
      showTag={showTag}
      light={light}
      tagline={tag}
    />
  );
}
