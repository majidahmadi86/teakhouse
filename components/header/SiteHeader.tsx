import Link from "next/link";
import { ChevronDown, MapPin, Menu, MessageCircle, Phone, User, X } from "lucide-react";
import { hotelConfig } from "@/config/hotel.config";
import { LogoMark } from "@/components/LogoMark";
import { Picture } from "@/components/Picture";
import type { ImageId } from "@/lib/images";
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
  "nav-link relative inline-flex h-full shrink-0 items-center whitespace-nowrap text-[12.5px] font-semibold uppercase tracking-[0.16em] transition";

/** The dropdown wrapper · the panel opens on hover and on keyboard focus, no script. */
const MENU_WRAP = "tkh-menu-wrap group/menu relative flex h-full shrink-0 items-center";
/** Rooms: the panel spans the header, under the whole bar. */
const MENU_WRAP_WIDE = "tkh-menu-wrap group/menu static flex h-full shrink-0 items-center";
const MENU_PANEL_WIDE =
  "absolute inset-x-0 top-full z-modal hidden group-hover/menu:block group-focus-within/menu:block";
const MENU_PANEL =
  "absolute start-1/2 top-full z-modal hidden -translate-x-1/2 pt-px group-hover/menu:block group-focus-within/menu:block rtl:translate-x-1/2";

/**
 * The guest header · ONE server component, zero hydration of its own.
 *
 * Desktop (1200 px and up) is two tiers: a slim concierge line (telephone,
 * address, language, currency, bookings) that scrolls away, and the main bar,
 * which stays: Rooms, Dining and Experiences, the crest centred, Events,
 * Location, Contact and "Book your stay". The header is sticky with a
 * negative top equal to the slim line, so the line leaves with the page and
 * the main bar holds, with no script and no layout work.
 *
 * Phones and tablets: the menu at the start, the crest centred, Book at the
 * end. The phone menu is a native popover with a :target fallback.
 *
 * `overHero` (home): the header lies over the photograph, white on a soft
 * shade, and turns to frosted stone once the page scrolls. Only when the
 * head script has armed <html data-motion>, so without scripts it stays solid.
 */
export function SiteHeader({ locale, overHero = false }: { locale: Lang; overHero?: boolean }) {
  const menuLabel = t(locale, "mobile.menu");
  const address = hotelConfig.contact.addressShort[locale === "th" ? "th" : "en"];

  return (
    <>
      <header
        data-site-header
        data-over={overHero ? "" : undefined}
        className="tkh-header sticky top-[calc(var(--demo-bar-h)-var(--util-h))] z-header"
      >
        <div className="tkh-util hidden h-[var(--util-h)] border-b min-[1200px]:block">
          <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-6 px-10 text-[12px] font-medium tracking-[0.08em]">
            <div className="flex items-center gap-7">
              <a href={`tel:${hotelConfig.contact.phone.replace(/\s/g, "")}`} className="tkh-util-link inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                {hotelConfig.contact.phone}
              </a>
              <Link href="/location" prefetch={false} className="tkh-util-link inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                {address}
              </Link>
            </div>
            <div className="tkh-util-tools flex items-center gap-1">
              <LanguageMenu current={locale} label={t(locale, "a11y.language")} />
              <CurrencySelect label={t(locale, "a11y.currency")} />
              <span className="mx-2 h-3.5 w-px bg-current opacity-25" aria-hidden />
              <Link href="/account" prefetch={false} className="tkh-util-link inline-flex items-center gap-2 px-1">
                <User className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                {t(locale, "acc.myBookings")}
              </Link>
            </div>
          </div>
        </div>

        <div className="tkh-bar h-[var(--header-h)] border-b">
          <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 max-[359px]:gap-1.5 max-[359px]:px-3 sm:px-6 xl:px-10">
            {/* Start: the phone menu, or Rooms · Dining · Experiences. */}
            <div className="flex h-full min-w-0 items-center">
              <button
                type="button"
                aria-label={menuLabel}
                aria-controls="mobile-nav-drawer"
                className="tkh-menu-btn tkh-tone -ms-2 flex h-10 items-center gap-2 rounded-full px-2 transition min-[1200px]:hidden"
                {...attrs({ popovertarget: "mobile-nav-drawer" })}
              >
                <Menu className="h-6 w-6" strokeWidth={1.4} aria-hidden />
                <span className="hidden text-[12px] font-semibold uppercase tracking-[0.16em] min-[600px]:inline">{menuLabel}</span>
              </button>
              <a
                href="#mobile-nav-drawer"
                aria-label={menuLabel}
                className="tkh-menu-fallback tkh-tone -ms-2 h-10 w-10 items-center justify-center min-[1200px]:!hidden"
              >
                <Menu className="h-6 w-6" strokeWidth={1.4} aria-hidden />
              </a>

              <nav
                aria-label={t(locale, "a11y.mainNav")}
                className="hidden h-full items-center gap-7 min-[1200px]:flex min-[1360px]:gap-9"
              >
                <div className={MENU_WRAP_WIDE}>
                  <Link href="/rooms" prefetch={false} data-nav="rooms" aria-haspopup="true" className={NAV_LINK}>
                    {t(locale, "nav.rooms")}
                    <ChevronDown className="ms-1 h-3 w-3 opacity-60 transition group-hover/menu:rotate-180" aria-hidden />
                  </Link>
                  <div data-menu-panel="rooms" className={MENU_PANEL_WIDE}>
                    <div className="tkh-menu-pop border-b border-line/70 bg-white shadow-float">
                      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_250px] gap-8 px-10 py-7">
                        <ul className="grid grid-cols-3 gap-x-4 gap-y-2">
                          {ROOM_CATALOGUE.map((room) => (
                            <li key={room.slug}>
                              <Link
                                href={`/rooms/${room.slug}`}
                                prefetch={false}
                                className="group/room flex items-center gap-4 rounded-soft p-2 transition hover:bg-stone"
                              >
                                <span className="relative block h-[78px] w-[108px] shrink-0 overflow-hidden rounded-[4px] bg-ivory">
                                  <Picture
                                    id={room.images[0].id as ImageId}
                                    alt=""
                                    sizes="108px"
                                    maxWidth={480}
                                    fill
                                    unveil={false}
                                    className="transition duration-700 ease-calm group-hover/room:scale-[1.06]"
                                  />
                                </span>
                                <span className="min-w-0">
                                  <span className="block font-display text-[16.5px] leading-snug text-ink">{tr(locale, room.name)}</span>
                                  <span className="mt-1 block text-[12.5px] font-medium text-teak">
                                    {t(locale, "room.from")} <Price thb={room.rate} />
                                  </span>
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

                {NAV_LEAD.slice(0, 1).map(({ href, id, key }) => (
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
                    <ChevronDown className="ms-1 h-3 w-3 opacity-60 transition group-hover/menu:rotate-180" aria-hidden />
                  </Link>
                  <div data-menu-panel="experience" className={MENU_PANEL}>
                    <div className="tkh-menu-pop w-64 rounded-b-card border border-t-0 border-line/70 bg-white p-2 shadow-float">
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
              </nav>
            </div>

            {/* The crest, centred. */}
            <Link href="/" prefetch={false} aria-label={hotelConfig.name} className="tkh-tone flex shrink-0 justify-center">
              <LogoMark showTag={false} size={24} className="min-[1200px]:hidden [&_.logo-word]:text-[16px] max-[359px]:[&_.logo-word]:text-[14px] [&_.logo-word]:tracking-[.14em] max-[359px]:gap-2" />
              <LogoMark layout="stacked" size={28} className="hidden min-[1200px]:inline-flex" />
            </Link>

            {/* End: Events · Location · Contact and Book. */}
            <div className="flex h-full min-w-0 items-center justify-end gap-7 min-[1360px]:gap-9">
              <div className="hidden h-full items-center gap-7 min-[1200px]:flex min-[1360px]:gap-9">
                {[...NAV_LEAD.slice(1), ...NAV_TAIL].map(({ href, id, key }) => (
                  <Link key={href} href={href} prefetch={false} data-nav={id} className={NAV_LINK}>
                    {t(locale, key)}
                  </Link>
                ))}
              </div>
              <Link
                href="/book"
                prefetch={false}
                className="btn-primary tkh-book hidden min-h-11 whitespace-nowrap px-6 text-[14px] min-[760px]:inline-flex"
              >
                {t(locale, "nav.book")}
              </Link>
              <Link
                href="/book"
                prefetch={false}
                className="btn-primary tkh-book min-h-10 px-4 text-[14px] max-[359px]:px-3 min-[760px]:hidden"
              >
                {t(locale, "nav.bookShort")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Phone and tablet menu · a full-screen sheet; the items arrive in turn. */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-label={menuLabel}
        className="tkh-drawer text-ink"
        {...attrs({ popover: "auto" })}
      >
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
          <LogoMark showTag={false} size={24} className="[&_.logo-word]:text-[16px]" />
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

        <nav className="tkh-drawer-nav flex flex-1 flex-col overflow-y-auto px-5 pb-2 pt-1 sm:px-8">
          {DRAWER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              data-nav={item.id}
              className="flex items-baseline justify-between gap-3 border-b border-line/80 py-3 text-ink"
            >
              <span className="font-display text-[24px] leading-tight">{t(locale, item.key)}</span>
              {"subtitle" in item ? (
                <span className="text-[13px] text-sub">{t(locale, item.subtitle)}</span>
              ) : null}
            </Link>
          ))}

          <details data-nav-details className="group border-b border-line/80">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display text-[24px] leading-tight text-ink [&::-webkit-details-marker]:hidden">
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

          {/* The house on the river, with its address · fetched only when the menu opens. */}
          <Link
            href="/location"
            prefetch={false}
            className="relative mb-2 mt-auto block h-[150px] shrink-0 overflow-hidden rounded-card bg-ivory"
          >
            <Picture
              id="hero-home"
              alt=""
              sizes="(max-width: 767px) calc(100vw - 40px), 720px"
              maxWidth={768}
              fill
              unveil={false}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />
            <span className="absolute inset-x-4 bottom-3 flex items-center gap-2 text-[13px] font-medium text-white">
              <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden />
              {address}
            </span>
          </Link>
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
