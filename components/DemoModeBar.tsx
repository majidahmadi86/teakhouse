"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hotelConfig } from "@/config/hotel.config";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Persistent demo switcher · Guest ⇄ Owner · PIN bypassed when DEMO_MODE.
 * Styled to site palette (navy/gold). Lives above page content · does not cover nav.
 */
export function DemoModeBar() {
  const pathname = usePathname();
  if (!DEMO) return null;
  const onOwner = pathname.startsWith("/owner");

  return (
    <div
      className="sticky top-0 z-[100] border-b border-line/80 bg-navy text-white"
      role="navigation"
      aria-label="Demo mode switcher"
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-2 text-[12px] sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-semibold tracking-wide">Viewing:</span>
          <Link
            href="/"
            className={
              !onOwner
                ? "rounded-full bg-white/15 px-2.5 py-1 font-bold"
                : "rounded-full px-2.5 py-1 text-white/70 hover:text-white"
            }
          >
            Guest site
          </Link>
          <span className="text-white/40" aria-hidden>
            ⇄
          </span>
          <Link
            href="/owner"
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
        <span className="hidden text-white/50 sm:inline">
          {hotelConfig.name}
        </span>
      </div>
    </div>
  );
}
