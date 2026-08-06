"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SafeImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  /** Tried in order when primary src fails. */
  fallbackSrcs?: string[];
};

/**
 * next/image via the Next/Vercel optimizer — AVIF/WebP + breakpoint widths,
 * edge-cached near the visitor. Origin stays Unsplash; visual quality unchanged.
 */
export function SafeImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
  sizes,
  quality = 75,
  fallbackSrcs = [],
}: SafeImageProps) {
  const sources = [src, ...fallbackSrcs];
  const [index, setIndex] = useState(0);
  const current = sources[index];
  const exhausted = index >= sources.length;

  if (exhausted || !current) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-navy to-navy",
          fill && "absolute inset-0",
          className
        )}
        role="img"
        aria-label={alt}
      />
    );
  }

  if (fill) {
    return (
      <Image
        key={current}
        src={current}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        onError={() => setIndex((i) => i + 1)}
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes ?? "100vw"}
        quality={quality}
      />
    );
  }

  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      className={className}
      onError={() => setIndex((i) => i + 1)}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
      quality={quality}
    />
  );
}
