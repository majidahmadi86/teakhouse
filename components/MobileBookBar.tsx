"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

export function MobileBookBar() {
  const { t } = useI18n();
  const { format } = useCurrency();
  const pathname = usePathname();
  const [visible, setVisible] = useState(pathname !== "/");

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(true);
      return;
    }

    setVisible(false);

    function onScroll() {
      const hero = document.getElementById("tkh-hero");
      if (!hero) {
        setVisible(window.scrollY > window.innerHeight * 0.55);
        return;
      }
      const bottom = hero.getBoundingClientRect().bottom;
      setVisible(bottom < 48);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="z-bar fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-3 pb-safe shadow-nav backdrop-blur-md md:hidden">
      <Link
        href="/book"
        prefetch={false}
        className="flex h-12 w-full items-center justify-center rounded-full bg-blue px-6 text-sm font-extrabold text-white transition hover:bg-blue-dark"
      >
        {t("mobile.book", { z: format(2100) })}
      </Link>
    </div>
  );
}
