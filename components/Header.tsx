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

function LangToggle({ light }: { light?: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={cn(
        "flex min-h-11 overflow-hidden rounded-full border",
        light ? "border-white/50 text-white" : "border-ink/20 text-ink"
      )}
    >
      {(["en", "th"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "min-h-11 min-w-11 px-3 text-xs font-bold transition",
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

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const lightNav = onHero && !solid;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-all duration-300",
          solid
            ? "bg-white py-3 text-ink shadow-nav"
            : "py-[18px]",
          lightNav && "text-white"
        )}
      >
        {lightNav ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgba(14,38,32,.55)] to-transparent"
          />
        ) : null}
        <div className="relative mx-auto flex max-w-[1180px] items-center justify-between gap-5 px-6">
          <Link href="/" className="shrink-0">
            <Logo light={lightNav} showTag={false} className="md:hidden" />
            <span className="hidden md:inline-flex">
              <Logo light={lightNav} showTag />
            </span>
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
            <LangToggle light={lightNav} />
            <Link
              href="/book"
              className="hidden min-h-11 items-center rounded-full bg-brand px-7 text-[0.92rem] font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-2 sm:inline-flex"
            >
              {t("nav.book")}
            </Link>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center md:hidden"
              aria-label={t("mobile.menu")}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-[26px] w-[26px]" />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <button
          type="button"
          aria-label={t("mobile.close")}
          className="fixed inset-0 z-[70] bg-ink/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[80] flex w-[min(100%,360px)] flex-col bg-white text-ink shadow-panel transition-transform duration-300 md:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo showTag={false} />
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center"
            aria-label={t("mobile.close")}
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-[30px] w-[30px]" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col px-2 pt-2">
          {[...NAV, { href: "/book", key: "nav.book" as const }].map(
            ({ href, key }, i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                style={{ transitionDelay: `${i * 50}ms` }}
                className={cn(
                  "border-b border-line px-4 py-5 font-display text-[1.55rem] transition",
                  drawerOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                )}
              >
                {t(key)}
              </Link>
            )
          )}
        </nav>
        <div className="border-t border-line px-6 py-6 text-sm">
          <p className="font-semibold text-gold">{t("brand.tag")}</p>
          <a href="https://line.me/" className="mt-3 block font-bold">
            LINE @teakhouse
          </a>
          <a href="tel:+6620000000" className="mt-1 block font-bold">
            +66 2 000 0000
          </a>
        </div>
      </aside>
    </>
  );
}
