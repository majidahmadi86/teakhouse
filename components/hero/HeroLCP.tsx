import { cn } from "@/lib/utils";

/** Server-rendered LCP hero — paints before any client JS hydrates. */
export function HeroLCP({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0", className)}>
      <picture>
        {/* CSS media (not DPR srcset) — phones stay on the small AVIF. */}
        <source
          media="(max-width: 768px)"
          srcSet="/hero-lcp-640.avif"
          type="image/avif"
        />
        <source
          media="(min-width: 769px)"
          srcSet="/hero-lcp-1920.avif"
          type="image/avif"
        />
        <img
          src="/hero-lcp-640.avif"
          alt="Resort pool at dusk overlooking the Chao Phraya"
          width={640}
          height={427}
          fetchPriority="high"
          decoding="sync"
          className="absolute inset-0 h-full w-full object-cover object-[center_32%] md:object-[center_42%]"
        />
      </picture>
    </div>
  );
}
