"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function MobileBookBar() {
  const { t } = useI18n();

  return (
    <div className="z-bar fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-3 pb-safe shadow-nav backdrop-blur-md md:hidden">
      <Link
        href="/book"
        className="flex h-12 w-full items-center justify-center rounded-full bg-blue px-6 text-sm font-extrabold text-white transition hover:bg-blue-dark"
      >
        {t("mobile.book")}
      </Link>
    </div>
  );
}
