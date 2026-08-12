import Link from "next/link";
import { BadgePercent, CalendarDays, ChevronDown, Menu, User } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { getServerPathname, t, type Lang } from "@/lib/serverLocale";
import { cn } from "@/lib/utils";

const NAV_CENTER = [
  { href: "/experience", key: "nav.experience" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/location", key: "nav.location" },
  { href: "/contact", key: "nav.contact" },
] as const;

/**
 * Zero-JS header · a PIXEL-IDENTICAL static twin of the hydrated Header's
 * steady state: same logo, same center nav, same offers/currency/lang/account
 * cluster, same book button + hamburger, driven by the SAME CSS breakpoints
 * (>=1200 center nav, >=760 utils, book text vs icon, hamburger <1200). It is
 * swapped for the interactive Header ~300ms after window load · because the
 * markup matches, the swap is invisible. Hydration adds only behaviour (menus
 * open, lang/currency switch) · never appearance. Keep this in lockstep with
 * Header's steady-state render (VISUAL PARITY LAW).
 */
export function HeaderShell({ locale = "en" }: { locale?: Lang }) {
  const pathname = getServerPathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const langClass = (l: Lang) =>
    cn(
      "whitespace-nowrap text-[13px] font-bold",
      l === locale ? "text-blue underline decoration-2 underline-offset-4" : "text-sub"
    );

  return (
    <header className="sticky top-[var(--demo-bar-h)] z-header h-14 border-b border-line bg-white md:h-16">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 min-[760px]:px-5 xl:px-6">
        {/* LEFT · logo */}
        <Link href="/" prefetch={false} className="shrink-0 whitespace-nowrap">
          <LogoMark
            showTag
            className="[&_.logo-tagline]:hidden min-[1440px]:[&_.logo-tagline]:block"
          />
        </Link>

        {/* CENTER nav · >=1200 */}
        <nav className="mx-auto hidden items-center gap-7 min-[1200px]:flex">
          <Link
            href="/rooms"
            prefetch={false}
            className={cn(
              "group relative inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[15px] font-semibold transition",
              isActive("/rooms") ? "text-blue" : "text-ink hover:text-blue"
            )}
          >
            {t(locale, "nav.rooms")}
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            <span
              className={cn(
                "absolute -bottom-1 left-0 h-0.5 bg-blue transition-all duration-300",
                isActive("/rooms") ? "w-full" : "w-0 group-hover:w-full"
              )}
            />
          </Link>
          {NAV_CENTER.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "link-draw shrink-0 whitespace-nowrap text-[15px] font-semibold transition",
                isActive(href) ? "text-blue" : "text-ink hover:text-blue"
              )}
            >
              {t(locale, key)}
            </Link>
          ))}
        </nav>

        {/* RIGHT utility cluster */}
        <div className="ml-auto flex shrink-0 items-center gap-[18px]">
          {/* wide utils · >=760 */}
          <div className="hidden items-center gap-[18px] min-[760px]:flex">
            {/* Offers */}
            <span className="group relative inline-flex">
              <Link
                href="/offers"
                prefetch={false}
                aria-label={t(locale, "nav.offers")}
                className={cn(
                  "offers-hit relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition duration-150",
                  isActive("/offers") && "bg-coral-bg"
                )}
              >
                <BadgePercent className="h-5 w-5 text-coral-deep" strokeWidth={2} aria-hidden />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-coral-deep motion-reduce:hidden" />
              </Link>
            </span>

            {/* Currency · static default label */}
            <span className="icon-hit inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[13px] font-bold text-ink">
              <span>฿ THB</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sub" aria-hidden />
            </span>

            {/* Language · EN | ไทย */}
            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <span className={langClass("en")}>EN</span>
              <span className="text-[13px] font-bold text-line" aria-hidden>|</span>
              <span className={langClass("th")}>ไทย</span>
            </div>

            {/* Account · signed-out */}
            <span className="group relative inline-flex">
              <Link
                href="/account/signin"
                prefetch={false}
                aria-label={t(locale, "acc.signin")}
                className="icon-hit inline-flex h-9 w-9 shrink-0 items-center justify-center text-ink"
              >
                <User className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
              </Link>
            </span>
          </div>

          {/* Book · text pill >=760 */}
          <Link
            href="/book"
            prefetch={false}
            className="btn-shine btn-primary hidden whitespace-nowrap min-[760px]:inline-flex"
          >
            {t(locale, "nav.book")}
          </Link>
          {/* Book · icon <760 */}
          <Link
            href="/book"
            prefetch={false}
            aria-label={t(locale, "nav.book")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue text-white shadow-cta min-[760px]:hidden"
          >
            <CalendarDays className="h-5 w-5" aria-hidden />
          </Link>

          {/* Hamburger <1200 · inert until the interactive Header replaces it */}
          <button
            type="button"
            aria-label={t(locale, "mobile.menu")}
            className="flex h-10 w-10 items-center justify-center min-[1200px]:hidden"
          >
            <Menu className="h-6 w-6 text-ink" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
