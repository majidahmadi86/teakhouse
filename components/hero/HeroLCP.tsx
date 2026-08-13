import { translateEntry as tr, type Lang } from "@/lib/translate";
import { cn } from "@/lib/utils";

/**
 * Server LCP hero · zero client JS.
 * Ken Burns is CSS-only and disabled on mobile (LH style/layout debt).
 */
export function HeroLCP({
  className,
  locale,
}: {
  className?: string;
  /** The alt text is the only copy here, and a screen reader reads it. */
  locale: Lang;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 origin-center tkh-ken-burns-live",
        className
      )}
    >
      <picture>
        <source
          media="(max-width: 640px)"
          srcSet="/hero-lcp-640.avif"
          type="image/avif"
        />
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
          src="/hero-lcp-640.avif"
          alt={tr(locale, {
            en: "Resort pool at dusk overlooking the Chao Phraya",
            th: "สระว่ายน้ำยามเย็นมองเห็นแม่น้ำเจ้าพระยา",
          })}
          width={640}
          height={853}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 1920px"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_32%] md:object-[center_42%]"
        />
      </picture>
    </div>
  );
}
