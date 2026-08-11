import { hotelConfig } from "@/config/hotel.config";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
  showTag?: boolean;
  light?: boolean;
  tagline?: string;
};

/**
 * Server-safe logo · house glyph + THE TEAK HOUSE wordmark (v7 identity).
 * No client JS.
 */
export function LogoMark({
  size = 24,
  className,
  showTag = true,
  light = false,
  tagline,
}: LogoMarkProps) {
  const tag = tagline ?? hotelConfig.tagline.en;

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("shrink-0", light ? "text-gold" : "text-navy")}
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
            "font-display text-[20px] font-normal leading-none tracking-[.04em]",
            light ? "text-white" : "text-navy"
          )}
        >
          {hotelConfig.nameDisplay}
        </div>
        {showTag ? (
          <div
            className={cn(
              "logo-tagline mt-1 text-[9px] font-bold uppercase tracking-[.22em]",
              light ? "text-gold" : "text-sub"
            )}
          >
            {tag}
          </div>
        ) : null}
      </div>
    </div>
  );
}
