"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useDemoModal } from "@/components/DemoModal";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const { open } = useDemoModal();

  return (
    <footer className="bg-brand px-6 py-[70px] pb-8 text-white/80">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-[18px] inline-block">
              <Logo light showTag />
            </Link>
            <p className="max-w-[34ch] text-[0.9rem]">{t("ft.about")}</p>
          </div>
          <div>
            <h4 className="mb-4 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-white">
              {t("ft.stay")}
            </h4>
            <Link href="/rooms" className="block py-1.5 text-[0.9rem] opacity-75 hover:opacity-100">
              {t("ft.rooms")}
            </Link>
            <Link href="/book" className="block py-1.5 text-[0.9rem] opacity-75 hover:opacity-100">
              {t("ft.book")}
            </Link>
          </div>
          <div>
            <h4 className="mb-4 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-white">
              {t("ft.visit")}
            </h4>
            <Link href="/experience" className="block py-1.5 text-[0.9rem] opacity-75 hover:opacity-100">
              {t("ft.exp")}
            </Link>
            <Link href="/location" className="block py-1.5 text-[0.9rem] opacity-75 hover:opacity-100">
              {t("ft.loc")}
            </Link>
          </div>
          <div>
            <h4 className="mb-4 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-white">
              {t("ft.talk")}
            </h4>
            <a href="tel:+6620000000" className="block py-1.5 text-[0.9rem] opacity-75 hover:opacity-100">
              +66 2 000 0000
            </a>
            <a
              href="mailto:stay@teakhouse.demo"
              className="block py-1.5 text-[0.9rem] opacity-75 hover:opacity-100"
            >
              stay@teakhouse.demo
            </a>
            <span className="block py-1.5 text-[0.9rem] opacity-75">LINE @teakhouse</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[0.78rem] opacity-60">
          <span>{t("ft.copy")}</span>
          <button
            type="button"
            onClick={open}
            className="cursor-pointer bg-transparent text-inherit underline"
          >
            {t("ft.fine")}
          </button>
        </div>
      </div>
    </footer>
  );
}
