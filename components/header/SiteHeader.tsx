import Link from "next/link";
import { ChevronDown, Menu, MessageCircle, Phone, User, X } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { Price } from "@/components/Price";
import { CurrencySelect } from "@/components/header/CurrencySelect";
import { HeaderSync } from "@/components/header/HeaderSync";
import { LanguageMenu } from "@/components/header/LanguageMenu";
import { DRAWER_NAV, EXPERIENCE_GROUP, NAV_LEAD, NAV_TAIL } from "@/components/header/nav";
import { ROOM_CATALOGUE } from "@/lib/rooms";
import { t, tr } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

/** React 18 has no types for the Popover API attributes · they pass through as-is. */
const attrs = (a: Record<string, string>) => a;

const NAV_LINK =
  "nav-link relative inline-flex h-full shrink-0 items-center whitespace-nowrap text-[15px] font-medium text-ink/80 transition hover:text-ink";

/** The dropdown wrapper · the panel opens on hover and on keyboard focus, no script. */
const MENU_WRAP = "group/menu relative flex h-full shrink-0 items-center";
const MENU_PANEL =
  "absolute start-1/2 top-full z-modal hidden -translate-x-1/2 pt-2 group-hover/menu:block group-focus-within/menu:block rtl:translate-x-1/2";

/**
 * The guest header · ONE server component, zero hydration of its own (the
 * five-star evolution of the v14 header, same mechanics):
 *
 * - logo (the house glyph and wordmark), the centre navigation from 1200 px,
 *   language, currency, account and the "Book your stay" action on the right;
 *   phones keep the logo, a Book action and the menu
 * - the Rooms and Experiences menus open on hover and keyboard focus in CSS
 * - the active item is lit by CSS from the page's own <NavMark>; HeaderSync
 *   adds aria-current and the scrolled state once scripts run
 * - the phone menu is a native popover with a :target fallback, so it opens
 *   without the Popover API and without JavaScript
 */
export function SiteHeader({ locale }: { locale: Lang }) {
  const menuLabel = t(locale, "mobile.menu");

  return (
    <>
      <header
        data-site-header
        className="tkh-header sticky top-[var(--demo-bar-h)] z-header h-[var(--header-h)] border-b border-line/80 bg-stone transition-[background-color,box-shadow] duration-300"
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center gap-5 px-4 max-[359px]:gap-2 max-[359px]:px-3 sm:px-6 xl:px-10">
          <Link href="/" prefetch={false} aria-label={t(locale, "brand.name")} className="shrink-0 whitespace-nowrap">
            <LogoMark
              showTag
              className="[&_.logo-tagline]:hidden min-[480px]:[&_.logo-tagline]:block min-[1200px]:[&_.logo-tagline]:hidden min-[1440px]:[&_.logo-tagline]:block"
            />
          </Link>

          <nav
            aria-label={t(locale, "a11y.mainNav")}
            className="mx-auto hidden h-full items-center gap-6 min-[1200px]:flex min-[1360px]:gap-8"
          >
            <div className={MENU_WRAP}>
              <Link href="/rooms" prefetch={false} data-nav="rooms" aria-haspopup="true" className={NAV_LINK}>
                {t(locale, "nav.rooms")}
                <ChevronDown className="ms-1 h-3.5 w-3.5 text-sub transition group-hover/menu:rotate-180" aria-hidden />
              </Link>
              <div data-menu-panel="rooms" className={MENU_PANEL}>
                <div className="tkh-menu-pop w-[min(92vw,720px)] rounded-card border border-line/70 bg-white p-3 shadow-float">
                  <div className="grid gap-1 md:grid-cols-[1fr_220px]">
                    <ul className="grid grid-cols-2 gap-1">
                      {ROOM_CATALOGUE.map((room) => (
                        <li key={room.slug}>
                          <Link
                            href={`/rooms/${room.slug}`}
                            prefetch={false}
                            className="block rounded-soft px-4 py-3 transition hover:bg-stone"
                          >
                            <span className="block font-display text-[17px] text-ink">{tr(locale, room.name)}</span>
                            <span className="mt-1 block text-[13px] text-sub">{tr(locale, room.summary)}</span>
                            <span className="mt-1.5 block text-[13px] font-medium text-teak">
                              {t(locale, "room.from")} <Price thb={room.rate} />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col justify-between rounded-soft bg-ivory/70 p-4">
                      <div className="flex flex-col gap-1">
                        {[
                          { href: "/rooms", key: "nav.megaAll" },
                          { href: "/rooms#compare", key: "nav.megaCompare" },
                          { href: "/offers", key: "nav.megaOffers" },
                        ].map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            prefetch={false}
                            className="rounded-soft px-2 py-2 text-[14.5px] font-medium text-ink transition hover:bg-white"
                          >
                            {t(locale, l.key)}
                          </Link>
                        ))}
                      </div>
                      <Link href="/book" prefetch={false} className="btn-primary mt-4 min-h-11 w-full text-[14px]">
                        {t(locale, "nav.book")}
                      </Link>
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
                className={NAV_LINK}
              >
                {t(locale, "nav.experiences")}
                <ChevronDown className="ms-1 h-3.5 w-3.5 text-sub transition group-hover/menu:rotate-180" aria-hidden />
              </Link>
              <div data-menu-panel="experience" className={MENU_PANEL}>
                <div className="tkh-menu-pop w-64 rounded-card border border-line/70 bg-white p-2 shadow-float">
                  {EXPERIENCE_GROUP.map(({ href, id, key }) => (
                    <Link
                      key={href}
                      href={href}
                      prefetch={false}
                      data-nav={id}
                      className="block rounded-soft px-4 py-2.5 text-[15px] text-ink transition hover:bg-stone"
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

          <div className="ms-auto flex shrink-0 items-center gap-1.5 max-[359px]:gap-1 min-[1200px]:ms-0">
            <div className="hidden items-center gap-0.5 min-[760px]:flex">
              <LanguageMenu current={locale} label={t(locale, "a11y.language")} />
              <CurrencySelect label={t(locale, "a11y.currency")} />
              <Link
                href="/account"
                prefetch={false}
                aria-label={t(locale, "acc.myBookings")}
                title={t(locale, "acc.myBookings")}
                className="icon-hit inline-flex h-10 w-10 shrink-0 items-center justify-center text-ink"
              >
                <User className="h-[20px] w-[20px]" strokeWidth={1.6} aria-hidden />
              </Link>
            </div>

            <Link
              href="/book"
              prefetch={false}
              className="btn-primary ms-2 hidden min-h-11 whitespace-nowrap px-6 text-[14.5px] min-[760px]:inline-flex"
            >
              {t(locale, "nav.book")}
            </Link>
            <Link
              href="/book"
              prefetch={false}
              className="btn-primary min-h-10 px-4 text-[14px] max-[359px]:px-3 min-[760px]:hidden"
            >
              {t(locale, "nav.bookShort")}
            </Link>

            <button
              type="button"
              aria-label={menuLabel}
              aria-controls="mobile-nav-drawer"
              className="tkh-menu-btn flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-ivory min-[1200px]:hidden"
              {...attrs({ popovertarget: "mobile-nav-drawer" })}
            >
              <Menu className="h-6 w-6 text-ink" strokeWidth={1.6} aria-hidden />
            </button>
            <a
              href="#mobile-nav-drawer"
              aria-label={menuLabel}
              className="tkh-menu-fallback h-10 w-10 items-center justify-center min-[1200px]:!hidden"
            >
              <Menu className="h-6 w-6 text-ink" strokeWidth={1.6} aria-hidden />
            </a>
          </div>
        </div>
      </header>

      {/* Phone and tablet menu · a full-screen solid sheet. */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-label={menuLabel}
        className="tkh-drawer text-ink"
        {...attrs({ popover: "auto" })}
      >
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
          <LogoMark showTag={false} size={22} />
          <button
            type="button"
            className="tkh-menu-btn flex h-10 w-10 items-center justify-center rounded-full hover:bg-ivory"
            aria-label={t(locale, "mobile.close")}
            {...attrs({ popovertarget: "mobile-nav-drawer", popovertargetaction: "hide" })}
          >
            <X className="h-5 w-5 text-ink" strokeWidth={1.6} aria-hidden />
          </button>
          <a
            href="#menu-closed"
            className="tkh-menu-fallback h-10 w-10 items-center justify-center"
            aria-label={t(locale, "mobile.close")}
          >
            <X className="h-5 w-5 text-ink" strokeWidth={1.6} aria-hidden />
          </a>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-5 pb-2 pt-1 sm:px-8">
          {DRAWER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              data-nav={item.id}
              className="flex items-baseline justify-between gap-3 border-b border-line/80 py-3 text-ink"
            >
              <span className="font-display text-[22px] leading-tight">{t(locale, item.key)}</span>
              {"subtitle" in item ? (
                <span className="text-[13px] text-sub">{t(locale, item.subtitle)}</span>
              ) : null}
            </Link>
          ))}

          <details data-nav-details className="group border-b border-line/80">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display text-[22px] leading-tight text-ink [&::-webkit-details-marker]:hidden">
              {t(locale, "nav.experiences")}
              <ChevronDown className="h-4 w-4 shrink-0 text-sub transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pb-2">
              {EXPERIENCE_GROUP.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  data-nav={item.id}
                  className="block py-2 ps-4 text-[16px] text-ink/80 transition hover:text-ink"
                >
                  {t(locale, item.key)}
                </Link>
              ))}
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3 border-b border-line/80 py-3">
            <LanguageMenu current={locale} label={t(locale, "a11y.language")} variant="drawer" />
            <CurrencySelect label={t(locale, "a11y.currency")} size="lg" />
            <Link
              href="/account"
              prefetch={false}
              className="ms-auto inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-medium text-ink"
            >
              <User className="h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden />
              {t(locale, "acc.myBookings")}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 py-3">
            <a href="tel:+6620000000" className="btn-secondary min-h-11 px-3 text-[14px]">
              <Phone className="h-4 w-4" aria-hidden />
              {t(locale, "ct.call")}
            </a>
            <a href="https://line.me/R/ti/p/@teakhouse" target="_blank" rel="noreferrer" className="btn-secondary min-h-11 px-3 text-[14px]">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t(locale, "ct.lineBtn")}
            </a>
          </div>
        </nav>

        <div className="shrink-0 border-t border-line p-4 sm:px-8 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
          <Link href="/book" prefetch={false} className="btn-primary h-[52px] w-full whitespace-nowrap">
            {t(locale, "nav.book")}
          </Link>
        </div>
      </div>
      <HeaderSync />
    </>
  );
}
