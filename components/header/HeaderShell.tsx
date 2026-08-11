import Link from "next/link";
import { hotelConfig } from "@/config/hotel.config";

/**
 * Zero-JS header chrome · enough for home LCP and guest deferred Header swap.
 */
export function HeaderShell() {
  return (
    <header className="sticky top-[var(--demo-bar-h)] z-50 h-14 border-b border-line bg-white md:h-16">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 min-[760px]:px-5 xl:px-6">
        <Link
          href="/"
          prefetch={false}
          className="shrink-0 font-display text-[1.15rem] leading-none tracking-wide text-navy"
        >
          {hotelConfig.name}
        </Link>
        <nav className="mx-auto hidden items-center gap-7 min-[1200px]:flex">
          <Link
            href="/rooms"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            Rooms
          </Link>
          <Link
            href="/experience"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            Experience
          </Link>
          <Link
            href="/gallery"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            Gallery
          </Link>
          <Link
            href="/location"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            Location
          </Link>
          <Link
            href="/contact"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            Contact
          </Link>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            href="/book"
            prefetch={false}
            className="inline-flex h-10 items-center justify-center rounded-full bg-blue px-4 text-[14px] font-bold text-white shadow-cta"
          >
            Book direct
          </Link>
        </div>
      </div>
    </header>
  );
}
