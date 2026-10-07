import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { DemoFineButton } from "@/components/site/DemoFineButton";
import { t } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

/**
 * Footer dim-white steps use literal hex-alpha, not `text-white/NN`.
 * The theme `white` is `var(--color-white, #FFFFFF)` with no <alpha-value>
 * placeholder, so Tailwind cannot generate slash-opacity whites · they would
 * silently fall back to inherited ink and read as dark text on navy.
 * #FFFFFFBF ≈ 75% · #FFFFFFA6 ≈ 65% · #FFFFFF8C ≈ 55% · #FFFFFF66 ≈ 40%.
 */
const linkClass =
  "flex min-h-[44px] items-center text-[0.9rem] text-[#FFFFFFBF] transition hover:text-white hover:underline hover:underline-offset-2";

const headingClass =
  "mb-4 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-gold";

/**
 * Footer · a pure server component, the v14 look unchanged. It used to be a
 * client component that shipped the dictionary hook to render static links;
 * the only island left is the fine-print button that opens the demo panel.
 */
export function SiteFooter({ locale }: { locale: Lang }) {
  return (
    <footer data-site-footer className="bg-navy px-6 py-[70px] pb-8 text-[#FFFFFFA6]">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" prefetch={false} aria-label={t(locale, "brand.name")} className="mb-[18px] inline-block">
              <LogoMark light showTag />
            </Link>
            <p className="max-w-[34ch] text-[0.9rem] text-[#FFFFFFA6]">{t(locale, "ft.about")}</p>
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
          </div>
          <div>
            <p className={headingClass}>{t(locale, "ft.visit")}</p>
            <Link href="/experience" prefetch={false} className={linkClass}>
              {t(locale, "ft.exp")}
            </Link>
            {/* No reserve-a-table link here on purpose · the v13 rule is that
                the CTA disappears everywhere when the owner switches
                reservations off, and /dining is the page that knows. */}
            <Link href="/dining" prefetch={false} className={linkClass}>
              {t(locale, "nav.dining")}
            </Link>
            <Link href="/events" prefetch={false} className={linkClass}>
              {t(locale, "nav.events")}
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
            <Link href="/location" prefetch={false} className={linkClass}>
              {t(locale, "ft.loc")}
            </Link>
          </div>
          <div>
            <p className={headingClass}>{t(locale, "ft.talk")}</p>
            <Link href="/contact" prefetch={false} className={linkClass}>
              {t(locale, "nav.contact")}
            </Link>
            <a href="tel:+6620000000" className={linkClass}>
              {t(locale, "ct.phone")}
            </a>
            <a href="mailto:stay@teakhouse.demo" className={linkClass}>
              {t(locale, "ct.mail")}
            </a>
            <span className="block py-1.5 text-[0.9rem] text-[#FFFFFFA6]">
              {t(locale, "ct.line")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-[0.78rem] text-[#FFFFFF8C] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span>{t(locale, "ft.copy")}</span>
          <DemoFineButton label={t(locale, "ft.fine")} />
        </div>
      </div>
    </footer>
  );
}
