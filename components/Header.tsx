"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/rooms", key: "nav.rooms" },
  { href: "/experience", key: "nav.experience" },
  { href: "/location", key: "nav.location" },
] as const;

function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex overflow-hidden rounded-full border border-current opacity-90">
      {(["en", "th"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "px-3 py-1.5 text-xs font-bold transition",
            lang === l ? "bg-gold text-white" : "bg-transparent"
          )}
        >
          {l === "en" ? "EN" : "ไทย"}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onHero =
    pathname === "/" ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/experience") ||
    pathname.startsWith("/location");

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const lightNav = onHero && !solid;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-all duration-300",
          solid
            ? "bg-surface-2/95 py-3 shadow-nav backdrop-blur-md"
            : "py-[18px]",
          lightNav && "text-white"
        )}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-5 px-6">
          <Link href="/" className="shrink-0">
            <Logo light={lightNav} />
          </Link>

          <nav className="hidden items-center gap-8 text-[0.92rem] font-semibold md:flex">
            {NAV.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "opacity-85 transition hover:opacity-100",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "text-gold opacity-100"
                    : lightNav
                      ? "text-white"
                      : "text-ink"
                )}
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3.5">
            <LangToggle />
            <Link
              href="/book"
              className="hidden rounded-full bg-gold px-7 py-3.5 text-[0.92rem] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#C29A5E] hover:shadow-lg sm:inline-flex"
            >
              {t("nav.book")}
            </Link>
            <button
              type="button"
              className="p-1.5 md:hidden"
              aria-label={t("mobile.menu")}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-[26px] w-[26px]" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[70] flex flex-col items-center justify-center gap-7 bg-brand font-display text-[1.4rem] text-white transition-transform duration-500",
          drawerOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <button
          type="button"
          className="absolute right-5 top-5 p-2"
          aria-label={t("mobile.close")}
          onClick={() => setDrawerOpen(false)}
        >
          <X className="h-[30px] w-[30px]" />
        </button>
        {NAV.map(({ href, key }) => (
          <Link key={href} href={href} onClick={() => setDrawerOpen(false)}>
            {t(key)}
          </Link>
        ))}
        <Link href="/book" onClick={() => setDrawerOpen(false)}>
          {t("nav.book")}
        </Link>
      </div>
    </>
  );
}
