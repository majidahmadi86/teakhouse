import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { t, type Lang } from "@/lib/serverLocale";

/**
 * Zero-JS header chrome · v7 logo identity + Rooms trigger lookalike.
 * Server-rendered in the resolved locale so nav labels never flash English.
 * Full Header (mega-menu, lang, currency) upgrades on interaction.
 */
export function HeaderShell({ locale = "en" }: { locale?: Lang }) {
  return (
    <header className="sticky top-[var(--demo-bar-h)] z-50 h-14 border-b border-line bg-white md:h-16">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 min-[760px]:px-5 xl:px-6">
        <Link href="/" prefetch={false} className="shrink-0 whitespace-nowrap">
          <LogoMark
            showTag
            className="[&_.logo-tagline]:hidden min-[1440px]:[&_.logo-tagline]:block"
          />
        </Link>

        <nav className="mx-auto hidden items-center gap-7 min-[1200px]:flex">
          <Link
            href="/rooms"
            prefetch={false}
            className="group relative inline-flex items-center gap-1 whitespace-nowrap text-[15px] font-semibold text-ink"
          >
            {t(locale, "nav.rooms")}
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-blue transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            href="/experience"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            {t(locale, "nav.experience")}
          </Link>
          <Link
            href="/gallery"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            {t(locale, "nav.gallery")}
          </Link>
          <Link
            href="/location"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            {t(locale, "nav.location")}
          </Link>
          <Link
            href="/contact"
            prefetch={false}
            className="text-[15px] font-semibold text-ink"
          >
            {t(locale, "nav.contact")}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            href="/book"
            prefetch={false}
            className="inline-flex h-10 items-center justify-center rounded-full bg-blue px-4 text-[14px] font-bold text-white shadow-cta"
          >
            {t(locale, "nav.book")}
          </Link>
        </div>
      </div>
    </header>
  );
}
