"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * LCP hero stays visible immediately (no opacity hide).
 * Ken Burns starts only after decode, and always from scale(1) — no jump.
 */
export function HeroLCP({
  className,
}: {
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLive(true);
    }
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 origin-center will-change-transform",
        live && "tkh-ken-burns-live",
        className
      )}
    >
      <picture>
        <source
          media="(max-width: 768px)"
          srcSet="/hero-lcp-828.avif"
          type="image/avif"
        />
        <source
          media="(min-width: 769px)"
          srcSet="/hero-lcp-1920.avif"
          type="image/avif"
        />
        <img
          ref={imgRef}
          src="/hero-lcp-828.avif"
          alt="Resort pool at dusk overlooking the Chao Phraya"
          width={828}
          height={1104}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLive(true)}
          className="absolute inset-0 h-full w-full object-cover object-[center_32%] md:object-[center_42%]"
        />
      </picture>
    </div>
  );
}
