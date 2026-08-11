import Link from "next/link";
import { cn } from "@/lib/utils";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Demo funnel · link to the Hotelier product page (demo builds only). */
const ABOUT_URL = "https://mikaro.studio/hotelier";

/** Fixed demo bar height · kept in sync with --demo-bar-h in globals / layout. */
export const DEMO_BAR_HEIGHT_PX = 40;

/**
 * Persistent demo switcher · Guest <-> Owner · PIN bypassed when DEMO_MODE.
 * One compact 40px row that never wraps. <640px: segmented Guest|Owner toggle
 * left + Hotelier pill (icon + short label) right; "Viewing:" and the sandbox
 * note are hidden (the note lives in the demo modal). Pure server component.
 */
export function DemoModeBar({
  variant = "guest",
}: {
  variant?: "guest" | "owner";
}) {
  if (!DEMO) return null;
  const onOwner = variant === "owner";

  const seg =
    "rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition sm:text-[12px]";

  return (
    <div
      className="fixed inset-x-0 top-0 z-demo-bar h-10 border-b border-line/80 bg-navy text-white"
      role="navigation"
      aria-label="Demo mode switcher"
    >
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between gap-2 px-3 text-[12px] sm:gap-3 sm:px-6">
        {/* Left · segmented Guest|Owner toggle */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden font-semibold tracking-wide sm:inline">
            Viewing:
          </span>
          <div className="flex items-center rounded-full bg-white/10 p-0.5">
            <Link
              href="/"
              prefetch={false}
              aria-current={!onOwner ? "page" : undefined}
              className={cn(seg, !onOwner ? "bg-white/20 text-white" : "text-white/65 hover:text-white")}
            >
              Guest<span className="hidden sm:inline"> site</span>
            </Link>
            <span className="px-1 text-white/45" aria-hidden>
              ⇄
            </span>
            <Link
              href="/owner"
              prefetch={false}
              aria-current={onOwner ? "page" : undefined}
              className={cn(seg, onOwner ? "bg-white/20 text-white" : "text-white/65 hover:text-white")}
            >
              Owner<span className="hidden sm:inline"> panel</span>
            </Link>
          </div>
        </div>

        {/* Sandbox note · desktop only (moves into the demo modal on mobile) */}
        <span className="hidden shrink-0 rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-semibold text-gold sm:inline-block">
          Sandbox · resets hourly · edit anything
        </span>

        {/* Right · Hotelier product pill */}
        <a
          href={ABOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy shadow-[0_1px_10px_rgba(232,169,61,.45)] transition hover:brightness-110 sm:px-3"
        >
          <svg
            className="h-3 w-3 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            aria-hidden
          >
            <path d="M7 17L17 7M17 7H8M17 7v9" />
          </svg>
          Hotelier<span className="hidden min-[380px]:inline">&nbsp;·&nbsp;about this system</span>
        </a>
      </div>
    </div>
  );
}
