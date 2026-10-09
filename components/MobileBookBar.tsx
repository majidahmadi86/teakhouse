import Link from "next/link";
import { Price } from "@/components/Price";
import { CATALOGUE_FROM_RATE } from "@/lib/rooms";
import { t } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

/**
 * The phone Book bar · static server HTML, fixed to the bottom below 768 px,
 * with no JavaScript needed to exist or to work. The nightly "from" price is
 * a <Price> island so it follows the currency.
 *
 * On home it stays below the screen until the hero's own booking panel has
 * scrolled away (`deferUntilScroll`): a scroll-driven CSS animation where the
 * browser has one, HeaderSync otherwise. Pages with their own booking UI
 * switch it off with <ChromeMark noBookBar />.
 */
export function MobileBookBar({
  locale,
  fromThb = CATALOGUE_FROM_RATE,
  deferUntilScroll = false,
}: {
  locale: Lang;
  fromThb?: number;
  deferUntilScroll?: boolean;
}) {
  return (
    <div
      data-mobile-book-bar
      {...(deferUntilScroll ? { "data-defer": "" } : {})}
      className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 px-4 pt-3 pb-safe shadow-dock backdrop-blur-md md:hidden"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 leading-tight">
          <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-sub">
            {t(locale, "room.from")}
          </span>
          <span className="block whitespace-nowrap text-[17px] font-semibold text-ink">
            <Price thb={fromThb} /> <span className="text-[13px] font-normal text-sub">{t(locale, "room.night")}</span>
          </span>
        </p>
        <Link href="/book" prefetch={false} className="btn-primary h-12 shrink-0 px-6 text-[15px]">
          {t(locale, "avail.go")}
        </Link>
      </div>
    </div>
  );
}
