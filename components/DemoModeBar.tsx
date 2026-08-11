import Link from "next/link";
import { hotelConfig } from "@/config/hotel.config";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Fixed demo bar height · kept in sync with --demo-bar-h in globals / layout. */
export const DEMO_BAR_HEIGHT_PX = 40;

/**
 * Persistent demo switcher · Guest ⇄ Owner · PIN bypassed when DEMO_MODE.
 * Pure server component · no client JS · no /owner prefetch on guest pages.
 */
export function DemoModeBar({
  variant = "guest",
}: {
  variant?: "guest" | "owner";
}) {
  if (!DEMO) return null;
  const onOwner = variant === "owner";

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] h-10 border-b border-line/80 bg-navy text-white"
      role="navigation"
      aria-label="Demo mode switcher"
    >
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between gap-3 px-4 text-[12px] sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-semibold tracking-wide">Viewing:</span>
          <Link
            href="/"
            prefetch={false}
            className={
              !onOwner
                ? "rounded-full bg-white/15 px-2.5 py-1 font-bold"
                : "rounded-full px-2.5 py-1 text-white/70 hover:text-white"
            }
          >
            Guest site
          </Link>
          <span className="text-white/55" aria-hidden>
            ⇄
          </span>
          <Link
            href="/owner"
            prefetch={false}
            className={
              onOwner
                ? "rounded-full bg-white/15 px-2.5 py-1 font-bold"
                : "rounded-full px-2.5 py-1 text-white/70 hover:text-white"
            }
          >
            Owner panel
          </Link>
        </div>
        <span className="shrink-0 rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-semibold text-gold">
          Sandbox · resets hourly · edit anything
        </span>
        <span className="hidden text-white/60 sm:inline">
          {hotelConfig.name}
        </span>
      </div>
    </div>
  );
}
