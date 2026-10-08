import { Picture } from "@/components/Picture";
import { translateEntry as tr } from "@/lib/i18n-core";
import type { Lang } from "@/lib/locales/meta";
import { cn } from "@/lib/utils";

/**
 * Server LCP hero · zero client JS. The registered "hero/home" image: AVIF
 * (WebP fallback) at 640, 828 and 1920 with sizes 100vw, so a phone takes the
 * width its screen actually needs, preloaded in <head> with fetchpriority
 * high (components/Picture priority). Ken Burns is CSS-only and off on phones.
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
    <div className={cn("absolute inset-0 origin-center tkh-ken-burns-live", className)}>
      <Picture
        id="hero/home"
        alt={tr(locale, {
          en: "Resort pool at dusk overlooking the Chao Phraya",
          th: "สระว่ายน้ำยามเย็นมองเห็นแม่น้ำเจ้าพระยา",
        })}
        sizes="100vw"
        priority
        fill
        className="object-[center_32%] md:object-[center_42%]"
      />
    </div>
  );
}
