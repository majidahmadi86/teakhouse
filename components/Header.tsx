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

function LangPair() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1.5">
      {(["en", "th"] as Lang[]).map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          {i > 0 ? (
            <span className="text-[14px] font-bold text-line" aria-hidden>
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLang(l)}
            className={cn(
              "text-[14px] font-bold transition",
              lang === l
                ? "text-blue underline decoration-2 underline-offset-4"
                : "text-sub hover:text-ink"
            )}
          >
            {l === "en" ? "EN" : "ไทย"}
          </button>
        </span>
      ))}
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-[15px] font-semibold transition",
        active
          ? "text-blue underline decoration-2 underline-offset-8"
          : "text-ink hover:text-blue hover:underline hover:decoration-2 hover:underline-offset-8"
      )}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-line bg-white md:h-16">
        <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between gap-4 px-5 md:gap-5 md:px-6">
          <Link href="/" className="shrink-0">
            <Logo
              showTag={false}
              className="md:hidden [&_.logo-tagline]:hidden"
            />
            <span className="hidden md:inline-flex">
              <Logo
                showTag
                className="[&_.logo-tagline]:hidden min-[1100px]:[&_.logo-tagline]:block"
              />
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map(({ href, key }) => (
              <NavLink
                key={href}
                href={href}
                label={t(key)}
                active={isActive(href)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-4 md:gap-5">
            <LangPair />
            <Link href="/book" className="btn-primary hidden sm:inline-flex">
              {t("nav.book")}
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center md:hidden"
              aria-label={t("mobile.menu")}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6 text-ink" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <button
          type="button"
          aria-label={t("mobile.close")}
          className="fixed inset-0 z-[55] bg-ink/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-drawer flex w-[min(100%,360px)] flex-col bg-white text-ink shadow-panel transition-transform duration-300 md:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <Logo showTag={false} />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center"
            aria-label={t("mobile.close")}
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-6 w-6 text-ink" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col px-2 pt-2">
          {NAV.map(({ href, key }, i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              style={{ transitionDelay: drawerOpen ? `${i * 50}ms` : "0ms" }}
              className={cn(
                "border-b border-line px-4 py-5 font-display text-[1.55rem] transition",
                isActive(href) ? "text-blue" : "text-ink",
                drawerOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-5">
          <Link
            href="/book"
            onClick={() => setDrawerOpen(false)}
            className="btn-primary w-full"
          >
            {t("nav.book")}
          </Link>
        </div>
      </aside>
    </>
  );
}
