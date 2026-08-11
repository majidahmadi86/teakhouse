"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { Logo } from "@/components/Logo";
import { useDemoModal } from "@/components/DemoModal";
import { useI18n } from "@/lib/i18n";

function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}

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

export function Footer() {
  const { t } = useI18n();
  const { open } = useDemoModal();

  return (
    <footer className="bg-navy px-6 py-[70px] pb-8 text-[#FFFFFFA6]">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-[18px] inline-block">
              <Logo light showTag />
            </Link>
            <p className="max-w-[34ch] text-[0.9rem] text-[#FFFFFFA6]">{t("ft.about")}</p>
          </div>
          <div>
            <p className={headingClass}>{t("ft.stay")}</p>
            <Link href="/rooms" className={linkClass}>
              {t("ft.rooms")}
            </Link>
            <Link href="/offers" className={linkClass}>
              {t("nav.offers")}
            </Link>
            <Link href="/book" className={linkClass}>
              {t("ft.book")}
            </Link>
          </div>
          <div>
            <p className={headingClass}>{t("ft.visit")}</p>
            <Link href="/experience" className={linkClass}>
              {t("ft.exp")}
            </Link>
            <Link href="/gallery" className={linkClass}>
              {t("nav.gallery")}
            </Link>
            <Link href="/location" className={linkClass}>
              {t("ft.loc")}
            </Link>
          </div>
          <div>
            <p className={headingClass}>{t("ft.talk")}</p>
            <Link href="/contact" className={linkClass}>
              {t("nav.contact")}
            </Link>
            <a href="tel:+6620000000" className={linkClass}>
              +66 2 000 0000
            </a>
            <a href="mailto:stay@teakhouse.demo" className={linkClass}>
              stay@teakhouse.demo
            </a>
            <span className="block py-1.5 text-[0.9rem] text-[#FFFFFFA6]">
              LINE @teakhouse
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-[0.78rem] text-[#FFFFFF8C] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span>{t("ft.copy")}</span>
          <button
            type="button"
            onClick={open}
            className="cursor-pointer bg-transparent text-inherit underline decoration-[#FFFFFF66] underline-offset-2 transition hover:text-white hover:decoration-white"
          >
            {t("ft.fine")}
          </button>
        </div>
      </div>
    </footer>
  );
}
