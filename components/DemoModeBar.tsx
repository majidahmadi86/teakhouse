import Link from "next/link";
import { cn } from "@/lib/utils";
import { translate, type Lang } from "@/lib/translate";
import { DemoOrderCta } from "@/components/DemoOrderCta";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Fixed demo bar height · kept in sync with --demo-bar-h in globals / layout. */
export const DEMO_BAR_HEIGHT_PX = 40;

/**
 * Presentation bar · Guest <-> Owner switcher (the wow) on the left, order CTA
 * on the right. One compact 40px row that never wraps · "Viewing:" collapses
 * below sm and the CTA shows a short label under 380px. Language follows the
 * resolved site locale (server prop). Pure server component · the CTA button is
 * the only client island. PIN is bypassed when DEMO_MODE.
 */
export function DemoModeBar({
  variant = "guest",
  locale,
}: {
  variant?: "guest" | "owner";
  locale: Lang;
}) {
  if (!DEMO) return null;
  const onOwner = variant === "owner";

  const seg =
    "rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition sm:text-[12px]";

  return (
    <div
      className="fixed inset-x-0 top-0 z-demo-bar h-10 border-b border-line/80 bg-navy text-white"
      role="navigation"
      aria-label={translate(locale, "a11y.demoSwitcher")}
    >
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between gap-2 px-3 text-[12px] sm:gap-3 sm:px-6">
        {/* Left · segmented Guest|Owner switcher */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden font-semibold tracking-wide sm:inline">
            {translate(locale, "db.viewing")}
          </span>
          <div className="flex items-center rounded-full bg-white/10 p-0.5">
            <Link
              href="/"
              prefetch={false}
              aria-current={!onOwner ? "page" : undefined}
              className={cn(
                seg,
                !onOwner ? "bg-white/20 text-white" : "text-white/65 hover:text-white"
              )}
            >
              {translate(locale, "db.guest")}
            </Link>
            <span className="px-1 text-white/45" aria-hidden>
              ⇄
            </span>
            <Link
              href="/owner"
              prefetch={false}
              aria-current={onOwner ? "page" : undefined}
              className={cn(
                seg,
                onOwner ? "bg-white/20 text-white" : "text-white/65 hover:text-white"
              )}
            >
              {translate(locale, "db.owner")}
            </Link>
          </div>
        </div>

        {/* Right · order CTA (opens the order modal) */}
        <DemoOrderCta
          label={translate(locale, "db.cta")}
          shortLabel={translate(locale, "db.ctaShort")}
        />
      </div>
    </div>
  );
}
