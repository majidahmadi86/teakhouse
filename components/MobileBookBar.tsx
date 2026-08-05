"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function MobileBookBar() {
  const { t } = useI18n();

  return (
    <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-line bg-white/95 p-3 shadow-nav backdrop-blur-md md:hidden">
      <Link
        href="/book"
        className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-extrabold text-white"
      >
        {t("mobile.book")}
      </Link>
    </div>
  );
}
