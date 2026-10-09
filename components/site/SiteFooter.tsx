import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { DemoFineButton } from "@/components/site/DemoFineButton";
import { t } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

const linkClass =
  "flex min-h-[40px] items-center text-[15px] text-ink/75 transition hover:text-ink";

const headingClass = "mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-teak";

/**
 * Footer · a pure server component. Bright and quiet: warm ivory, deep teak
 * ink, four calm columns and the address, never a dark band. The only island
 * is the fine-print button that opens the demo panel.
 */
export function SiteFooter({ locale }: { locale: Lang }) {
  return (
    <footer data-site-footer className="border-t border-line bg-ivory text-ink">
      <div className="wrap pb-10 pt-16 md:pt-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr] lg:gap-12">
          <div>
            <Link href="/" prefetch={false} aria-label={t(locale, "brand.name")} className="inline-block">
              <LogoMark showTag />
            </Link>
            <p className="mt-6 max-w-[36ch] text-[15px] leading-relaxed text-ink/75">{t(locale, "ft.about")}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-ink/75">{t(locale, "ct.address")}</p>
          </div>
          <div>
            <p className={headingClass}>{t(locale, "ft.stay")}</p>
            <Link href="/rooms" prefetch={false} className={linkClass}>
              {t(locale, "ft.rooms")}
            </Link>
            <Link href="/offers" prefetch={false} className={linkClass}>
              {t(locale, "nav.offers")}
            </Link>
            <Link href="/book" prefetch={false} className={linkClass}>
              {t(locale, "ft.book")}
            </Link>
            <Link href="/account" prefetch={false} className={linkClass}>
              {t(locale, "acc.myBookings")}
            </Link>
          </div>
          <div>
            <p className={headingClass}>{t(locale, "ft.visit")}</p>
            {/* No reserve-a-table link here on purpose · the v13 rule is that
                the CTA disappears everywhere when the owner switches
                reservations off, and /dining is the page that knows. */}
            <Link href="/dining" prefetch={false} className={linkClass}>
              {t(locale, "nav.dining")}
            </Link>
            <Link href="/events" prefetch={false} className={linkClass}>
              {t(locale, "nav.events")}
            </Link>
            <Link href="/experience" prefetch={false} className={linkClass}>
              {t(locale, "ft.exp")}
            </Link>
            <Link href="/facilities" prefetch={false} className={linkClass}>
              {t(locale, "nav.facilities")}
            </Link>
            <Link href="/experience#house" prefetch={false} className={linkClass}>
              {t(locale, "house.eyebrow")}
            </Link>
            <Link href="/gallery" prefetch={false} className={linkClass}>
              {t(locale, "nav.gallery")}
            </Link>
          </div>
          <div>
            <p className={headingClass}>{t(locale, "ft.talk")}</p>
            <Link href="/contact" prefetch={false} className={linkClass}>
              {t(locale, "nav.contact")}
            </Link>
            <Link href="/location" prefetch={false} className={linkClass}>
              {t(locale, "ft.loc")}
            </Link>
            <a href="tel:+6620000000" className={linkClass}>
              {t(locale, "ct.phone")}
            </a>
            <a href="mailto:stay@teakhouse.demo" className={linkClass}>
              {t(locale, "ct.mail")}
            </a>
            <span className="flex min-h-[40px] items-center text-[15px] text-ink/75">{t(locale, "ct.line")}</span>
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[13.5px] text-ink/65">
          <span>{t(locale, "ft.copy")}</span>
          <DemoFineButton label={t(locale, "ft.fine")} />
        </div>
      </div>
    </footer>
  );
}
