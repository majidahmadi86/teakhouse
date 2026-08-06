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
        <source
          media="(min-width: 769px)"
          srcSet="/hero-lcp-1920.avif"
          type="image/avif"
        />
        <img
          src="/hero-lcp-828.avif"
          alt="Resort pool at dusk overlooking the Chao Phraya"
          width={828}
          height={1104}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_32%] md:object-[center_42%]"
        />
      </picture>
    </div>
  );
}
