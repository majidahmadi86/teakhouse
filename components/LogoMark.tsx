import { hotelConfig } from "@/config/hotel.config";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
  showTag?: boolean;
  light?: boolean;
  tagline?: string;
  /** "inline": crest beside the wordmark · "stacked": crest above it, centred (the desktop header). */
  layout?: "inline" | "stacked";
};

/**
 * The crest · a teak house under an arched doorway: the crossed kalae boards
 * of a northern Thai gable above the roof, posts, and the river below.
 * Hairline strokes in currentColor, so the header can turn it white over a
 * photograph and back to teak on stone without a second asset.
 */
export function LogoCrest({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("logo-glyph shrink-0", className)}
      width={size}
      height={size}
      aria-hidden
    >
      <path d="M7 45 V21 A17 17 0 0 1 41 21 V45" />
      <path d="M12.5 31.5 L27.5 13 M35.5 31.5 L20.5 13" />
      <path d="M17 28.5 V37 M31 28.5 V37 M24 26 V37" />
      <path d="M14.5 37 H33.5" />
      <path d="M12 41.5 q3 -1.8 6 0 t6 0 t6 0 t6 0" />
    </svg>
  );
}

/**
 * Server-safe logo · the crest and THE TEAK HOUSE wordmark. No client JS.
 */
export function LogoMark({
  size = 28,
  className,
  showTag = true,
  light = false,
  tagline,
  layout = "inline",
}: LogoMarkProps) {
  const tag = tagline ?? hotelConfig.tagline.en;

  if (layout === "stacked") {
    return (
      <div className={cn("logo-stacked inline-flex flex-col items-center text-center", className)}>
        <LogoCrest size={size} className={cn("logo-crest", light ? "text-white" : "text-teak")} />
        <div
          className={cn(
            "logo-word keep-tracking mt-1 whitespace-nowrap font-display text-[20px] font-normal leading-none tracking-[.2em]",
            light ? "text-white" : "text-ink"
          )}
        >
          {hotelConfig.nameDisplay}
        </div>
        {showTag ? (
          <div
            className={cn(
              "logo-tagline keep-tracking mt-1.5 flex items-center gap-2 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-[.32em]",
              light ? "text-white/80" : "text-teak"
            )}
          >
            <span className="logo-rule h-px w-5 bg-current opacity-60" aria-hidden />
            {tag}
            <span className="logo-rule h-px w-5 bg-current opacity-60" aria-hidden />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoCrest size={size} className={cn("logo-crest", light ? "text-white" : "text-teak")} />
      <div className="min-w-0">
        <div
          className={cn(
            "logo-word keep-tracking whitespace-nowrap font-display text-[19px] font-normal leading-none tracking-[.16em]",
            light ? "text-white" : "text-ink"
          )}
        >
          {hotelConfig.nameDisplay}
        </div>
        {showTag ? (
          <div
            className={cn(
              "logo-tagline keep-tracking mt-1.5 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-[.3em]",
              light ? "text-white/80" : "text-teak"
            )}
          >
            {tag}
          </div>
        ) : null}
      </div>
    </div>
  );
}
