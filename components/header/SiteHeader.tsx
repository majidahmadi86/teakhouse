import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  CalendarDays,
  ChevronDown,
  Menu,
  MessageCircle,
  Phone,
  User,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { Price } from "@/components/Price";
import { CurrencySelect } from "@/components/header/CurrencySelect";
import { HeaderSync } from "@/components/header/HeaderSync";
import { LanguageMenu } from "@/components/header/LanguageMenu";
import {
  DRAWER_NAV,
  EXPERIENCE_GROUP,
  NAV_LEAD,
  NAV_TAIL,
} from "@/components/header/nav";
import { getSeedGuestRooms } from "@/lib/guestRooms";
import { t, tr } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

/** React 18 has no types for the Popover API attributes · they pass through as-is. */
const attrs = (a: Record<string, string>) => a;

const NAV_LINK =
  "link-draw shrink-0 whitespace-nowrap text-[15px] font-semibold text-ink transition hover:text-blue";

const MENU_TRIGGER =
  "group relative inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[15px] font-semibold text-ink transition hover:text-blue";

const MENU_RULE =
  "absolute -bottom-1 left-0 h-0.5 w-0 bg-blue transition-all duration-300 group-hover:w-full";

/** The dropdown wrapper · the panel opens on hover and on keyboard focus, no script. */
const MENU_WRAP = "group/menu relative shrink-0";
const MENU_PANEL =
  "absolute left-0 top-full z-modal hidden pt-3 group-hover/menu:block group-focus-within/menu:block";

/**
 * The guest header · ONE server component, zero hydration of its own.
 *
 * It keeps the v14 Teak House look exactly (logo, six-item centre nav from
 * 1200px, offers, currency, language, account, Book direct, phone menu) and
 * replaces the old pair of a static shell plus a hydrated twin (HeaderShell +
 * Header, held pixel-identical by hand under the VISUAL PARITY LAW). There is
 * nothing left to swap, so nothing can flash or drift:
 *
 * - The Rooms and Experience dropdowns open on hover and keyboard focus in CSS.
 * - The active item is lit by CSS from the page's own <NavMark>, so the static
 *   HTML is right for every route and every language without reading the
 *   request; HeaderSync adds aria-current once scripts run.
 * - The phone menu is a native popover (top layer, light dismiss, Escape, no
 *   JavaScript). Where the Popover API is missing, a #mobile-nav-drawer link
 *   opens the same drawer through :target, with or without JavaScript.
 * - Currency is a tiny native-select island on the shared store; languages are
 *   plain links (LanguageMenu).
 */
export function SiteHeader({ locale }: { locale: Lang }) {
  const rooms = getSeedGuestRooms().slice(0, 4);
  const menuLabel = t(locale, "mobile.menu");

  return (
    <>
      <header
        data-site-header
        className="tkh-header sticky top-[var(--demo-bar-h)] z-header h-14 border-b border-line bg-white transition-[background-color,box-shadow,backdrop-filter] duration-300 md:h-16"
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 max-[359px]:gap-2 max-[359px]:px-3 min-[760px]:px-5 xl:px-6">
          {/* LEFT · logo */}
          <Link
            href="/"
            prefetch={false}
            aria-label={t(locale, "brand.name")}
            className="shrink-0 whitespace-nowrap"
          >
            <LogoMark
              showTag
              className="[&_.logo-tagline]:hidden min-[1440px]:[&_.logo-tagline]:block"
            />
          </Link>

          {/* CENTRE nav · >=1200. The gap tightens in the 1200-1279 band: six
              items at gap-7 push the utility cluster past the viewport at
              exactly 1200. */}
          <nav
            aria-label={t(locale, "a11y.mainNav")}
            className="mx-auto hidden items-center gap-5 min-[1200px]:flex min-[1280px]:gap-7"
          >
            <div className={MENU_WRAP}>
              <Link
                href="/rooms"
                prefetch={false}
                data-nav="rooms"
                aria-haspopup="true"
                className={MENU_TRIGGER}
              >
                {t(locale, "nav.rooms")}
                <ChevronDown className="h-3.5 w-3.5 transition group-hover/menu:rotate-180" aria-hidden />
                <span data-nav-rule className={MENU_RULE} />
              </Link>
              <div data-menu-panel="rooms" className={MENU_PANEL}>
                <div className="tkh-menu-pop w-[min(92vw,720px)] rounded-2xl bg-white p-5 shadow-2xl">
                  <div className="grid gap-5 md:grid-cols-[1fr_180px]">
                    <div className="grid grid-cols-2 gap-3">
                      {rooms.map((room) => (
                        <Link
                          key={room.id}
                          href={`/rooms/${room.slug}`}
                          prefetch={false}
                          className="flex gap-3 rounded-xl p-2 transition hover:bg-cloud"
                        >
                          <div className="relative h-[54px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-cloud">
                            <Image
                              src={room.photos[0]}
                              alt={tr(locale, room.name)}
                              fill
                              sizes="72px"
                              loading="lazy"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-ink">
                              {tr(locale, room.name)}
                            </div>
                            <div className="mt-0.5 whitespace-nowrap text-xs font-semibold text-blue">
                              {t(locale, "room.from")} <Price thb={room.rate} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                      {[
                        { href: "/rooms", key: "nav.megaAll" },
                        { href: "/rooms#compare", key: "nav.megaCompare" },
                        { href: "/offers", key: "nav.megaOffers" },
                      ].map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          prefetch={false}
                          className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                        >
                          {t(locale, l.key)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {NAV_LEAD.map(({ href, id, key }) => (
              <Link key={href} href={href} prefetch={false} data-nav={id} className={NAV_LINK}>
                {t(locale, key)}
              </Link>
            ))}

            <div className={MENU_WRAP}>
              <Link
                href="/experience"
                prefetch={false}
                data-nav-group="experience"
                aria-haspopup="true"
                className={MENU_TRIGGER}
              >
                {t(locale, "nav.experience")}
                <ChevronDown className="h-3.5 w-3.5 transition group-hover/menu:rotate-180" aria-hidden />
                <span data-nav-rule className={MENU_RULE} />
              </Link>
              <div data-menu-panel="experience" className={MENU_PANEL}>
                <div className="tkh-menu-pop w-56 rounded-2xl bg-white p-2 shadow-2xl">
                  {EXPERIENCE_GROUP.map(({ href, id, key }) => (
                    <Link
                      key={href}
                      href={href}
                      prefetch={false}
                      data-nav={id}
                      className="block rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                    >
                      {t(locale, key)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {NAV_TAIL.map(({ href, id, key }) => (
              <Link key={href} href={href} prefetch={false} data-nav={id} className={NAV_LINK}>
                {t(locale, key)}
              </Link>
            ))}
          </nav>

          {/* RIGHT utility cluster */}
          {/* Below 360px the gaps tighten: the logo, the Book icon and the menu
              must fit a 320px screen without scrolling sideways. */}
          <div className="ms-auto flex shrink-0 items-center gap-[18px] max-[359px]:gap-2">
            {/* wide utils · >=760 */}
            <div className="hidden items-center gap-[18px] min-[760px]:flex">
              <span className="group relative inline-flex">
                <Link
                  href="/offers"
                  prefetch={false}
                  data-nav="offers"
                  aria-label={t(locale, "nav.offers")}
                  title={t(locale, "nav.offers")}
                  className="offers-hit relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition duration-150"
                >
                  <BadgePercent className="h-5 w-5 text-coral-deep" strokeWidth={2} aria-hidden />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-coral-deep motion-reduce:hidden" />
                </Link>
              </span>

              <CurrencySelect label={t(locale, "a11y.currency")} />

              <LanguageMenu current={locale} label={t(locale, "a11y.language")} />

              <span className="group relative inline-flex">
                <Link
                  href="/account"
                  prefetch={false}
                  aria-label={t(locale, "acc.myBookings")}
                  title={t(locale, "acc.myBookings")}
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

            {/* Phone menu <1200 · a native popover, no script. */}
            <button
              type="button"
              aria-label={menuLabel}
              aria-controls="mobile-nav-drawer"
              className="tkh-menu-btn flex h-10 w-10 items-center justify-center min-[1200px]:hidden"
              {...attrs({ popovertarget: "mobile-nav-drawer" })}
            >
              <Menu className="h-6 w-6 text-ink" strokeWidth={2} aria-hidden />
            </button>
            {/* Where the Popover API is missing: the same drawer via :target. */}
            <a
              href="#mobile-nav-drawer"
              aria-label={menuLabel}
              className="tkh-menu-fallback h-10 w-10 items-center justify-center min-[1200px]:!hidden"
            >
              <Menu className="h-6 w-6 text-ink" strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>
      </header>

      {/* Phone and tablet menu · a full-screen solid sheet. Outside <header> on
          purpose: the header's own <nav> is the centre nav. */}
      <aside
        id="mobile-nav-drawer"
        aria-label={menuLabel}
        className="tkh-drawer text-ink"
        {...attrs({ popover: "auto" })}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
          <LogoMark showTag={false} size={20} className="[&_div]:text-[16px]" />
          <button
            type="button"
            className="tkh-menu-btn flex h-10 w-10 items-center justify-center"
            aria-label={t(locale, "mobile.close")}
            {...attrs({ popovertarget: "mobile-nav-drawer", popovertargetaction: "hide" })}
          >
            <X className="h-5 w-5 text-ink" strokeWidth={2} aria-hidden />
          </button>
          <a
            href="#menu-closed"
            className="tkh-menu-fallback h-10 w-10 items-center justify-center"
            aria-label={t(locale, "mobile.close")}
          >
            <X className="h-5 w-5 text-ink" strokeWidth={2} aria-hidden />
          </a>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-1">
          {DRAWER_NAV.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                data-nav={item.id}
                className="flex items-center gap-2 border-b border-line px-4 py-3.5 text-ink transition"
              >
                {"offers" in item && item.offers ? (
                  <BadgePercent className="h-4 w-4 shrink-0 text-coral-deep" aria-hidden />
                ) : null}
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-[17px] font-semibold">
                    {t(locale, item.key)}
                  </span>
                  {"subtitle" in item ? (
                    <span className="mt-0.5 block text-[12px] font-semibold text-sub">
                      {t(locale, item.subtitle)}
                    </span>
                  ) : null}
                </span>
              </Link>
            </div>
          ))}

          {/* Experience group · one row that opens in place. <details> keeps
              this working with no JavaScript and with no extra state. */}
          <details data-nav-details className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {t(locale, "nav.exploreGroup")}
              <ChevronDown className="h-4 w-4 shrink-0 text-sub transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pb-1">
              {EXPERIENCE_GROUP.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  data-nav={item.id}
                  className="block py-2.5 pe-4 ps-8 text-[15px] font-semibold text-sub transition"
                >
                  {t(locale, item.key)}
                </Link>
              ))}
            </div>
          </details>

          <div className="border-b border-line px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-5">
              <CurrencySelect label={t(locale, "a11y.currency")} size="lg" />
              <LanguageMenu current={locale} label={t(locale, "a11y.language")} variant="drawer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3.5">
            <a
              href="tel:+6620000000"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blue bg-white text-[13px] font-bold text-blue"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {t(locale, "ct.call")}
            </a>
            <a
              href="https://line.me/R/ti/p/@teakhouse"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blue bg-white text-[13px] font-bold text-blue"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {t(locale, "ct.lineBtn")}
            </a>
          </div>

          <div className="border-b border-line px-4 py-3.5">
            <Link
              href="/account"
              prefetch={false}
              className="inline-flex items-center gap-2 whitespace-nowrap text-[17px] font-semibold text-ink"
            >
              <User className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
              {t(locale, "acc.myBookings")}
            </Link>
          </div>
        </nav>

        <div className="shrink-0 border-t border-line p-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
          <Link href="/book" prefetch={false} className="btn-shine btn-primary w-full whitespace-nowrap">
            {t(locale, "nav.book")}
          </Link>
        </div>
      </aside>
      <HeaderSync />
    </>
  );
}
