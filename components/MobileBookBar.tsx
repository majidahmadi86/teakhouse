import Link from "next/link";
import { Price } from "@/components/Price";
import { t } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

/**
 * Phone "Book direct · from ฿2,100" bar · static server HTML, present below
 * 768px with no JavaScript needed to exist or to work (it used to mount 300ms
 * after load). The price is a <Price> island so it follows the currency.
 *
 * On home it stays below the screen until the hero's own booking widget has
 * scrolled away (`deferUntilScroll`): a scroll-driven CSS animation where the
 * browser has one, HeaderSync otherwise. Pages with their own booking bar
 * switch it off with <ChromeMark noBookBar />.
 */
export function MobileBookBar({
  locale,
  fromThb = 2100,
  deferUntilScroll = false,
}: {
  locale: Lang;
  fromThb?: number;
  deferUntilScroll?: boolean;
}) {
  const [before, after = ""] = t(locale, "mobile.book").split("{z}");

  return (
    <div
      data-mobile-book-bar
      {...(deferUntilScroll ? { "data-defer": "" } : {})}
      className="z-sticky fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-3 pb-safe shadow-nav backdrop-blur-md md:hidden"
    >
      <Link
        href="/book"
        prefetch={false}
        className="flex h-12 w-full items-center justify-center rounded-full bg-blue px-6 text-sm font-extrabold text-white transition hover:bg-blue-dark"
      >
        <span>
          {before}
          <Price thb={fromThb} />
          {after}
        </span>
      </Link>
    </div>
  );
}
