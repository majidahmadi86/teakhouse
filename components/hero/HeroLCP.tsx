import { cn } from "@/lib/utils";

/** Server-rendered LCP hero — paints before any client JS hydrates. */
export function HeroLCP({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0", className)}>
      <img
        src="/hero-lcp-640.avif"
        srcSet="/hero-lcp-640.avif 640w, /hero-lcp-1920.avif 1920w"
        sizes="100vw"
        alt="Resort pool at dusk overlooking the Chao Phraya"
        width={1920}
        height={1280}
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover object-[center_32%] md:object-[center_42%]"
      />
    </div>
  );
}
