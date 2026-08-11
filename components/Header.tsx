"use client";

import dynamic from "next/dynamic";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  BadgePercent,
  CalendarDays,
  Menu,
  MessageCircle,
  Phone,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n, type Lang } from "@/lib/i18n";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

/** Prefetch off · viewport Links were downloading every guest route during LH. */
function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}

const CurrencySwitcher = dynamic(
  () =>
    import("@/components/CurrencySwitcher").then((m) => m.CurrencySwitcher),
  { ssr: false }
);

const RoomsMegaMenu = dynamic(
  () =>
    import("@/components/header/RoomsMegaMenu").then((m) => m.RoomsMegaMenu),
  { ssr: false }
);

const NAV_CENTER = [
  { href: "/experience", key: "nav.experience" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/location", key: "nav.location" },
  { href: "/contact", key: "nav.contact" },
] as const;

const DRAWER_NAV = [
  { href: "/rooms", key: "nav.rooms", subtitle: "nav.roomsCount" as const },
  { href: "/offers", key: "nav.offers", offers: true },
  { href: "/experience", key: "nav.experience" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/location", key: "nav.location" },
  { href: "/contact", key: "nav.contact" },
] as const;

function LangPair({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap", className)}>
      {(["en", "th"] as Lang[]).map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          {i > 0 ? (
            <span className="text-[13px] font-bold text-line" aria-hidden>
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-label={l === "en" ? "EN English" : "ไทย Thai"}
            aria-pressed={lang === l}
            className={cn(
              "whitespace-nowrap text-[13px] font-bold transition",
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

function AccountEntry({ iconOnly }: { iconOnly?: boolean }) {
  const { t } = useI18n();
  const { user, signOut } = useGuestAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) {
    if (iconOnly) {
      return (
        <Tooltip label={t("acc.signin")}>
          <Link
            href="/account/signin"
            className="icon-hit inline-flex h-9 w-9 shrink-0 items-center justify-center text-ink"
            aria-label={t("acc.signin")}
          >
            <User className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
          </Link>
        </Tooltip>
      );
    }
    return (
      <Link
        href="/account/signin"
        className="inline-flex items-center gap-2 whitespace-nowrap text-[17px] font-semibold text-ink"
      >
        <User className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        {t("acc.signin")}
      </Link>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "G";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue text-[13px] font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user.name}
      >
        {initial}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[80] mt-2 min-w-[180px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sky"
          >
            {t("acc.myBookings")}
          </Link>
          <Link
            href="/account#profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sky"
          >
            {t("acc.profile")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              signOut();
              setOpen(false);
              router.push("/");
            }}
            className="block w-full whitespace-nowrap px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-sky"
          >
            {t("acc.signout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function OffersIconLink({ active }: { active: boolean }) {
  const { t } = useI18n();

  return (
    <Tooltip label={t("nav.offers")}>
      <Link
        href="/offers"
        aria-label={t("nav.offers")}
        className={cn(
          "offers-hit relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition duration-150",
          active && "bg-coral-bg"
        )}
      >
        <BadgePercent
          className="h-5 w-5 text-coral-deep"
          strokeWidth={2}
          aria-hidden
        />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-coral-deep motion-reduce:hidden" />
      </Link>
    </Tooltip>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "link-draw shrink-0 whitespace-nowrap text-[15px] font-semibold transition",
        active ? "text-blue" : "text-ink hover:text-blue"
      )}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const { t } = useI18n();
  const { user, signOut } = useGuestAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Mount desktop-only trees only when needed — avoids hydrating mega-menu /
  // headlessui currency on mobile Lighthouse runs.
  const showDesktopNav = useMediaQuery("(min-width: 1200px)");
  const showWideUtils = useMediaQuery("(min-width: 760px)");

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

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-[var(--demo-bar-h)] z-50 h-14 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300 md:h-16",
          scrolled
            ? "border-line/80 bg-white/85 shadow-[0_1px_0_rgba(16,24,40,.06)] backdrop-blur-md"
            : "border-line bg-white"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 min-[760px]:px-5 xl:px-6">
          {/* LEFT: emblem + wordmark */}
          <Link href="/" className="shrink-0 whitespace-nowrap">
            <Logo
              showTag
              className="[&_.logo-tagline]:hidden min-[1440px]:[&_.logo-tagline]:block"
            />
          </Link>

          {/* CENTER nav: ≥1200px */}
          {showDesktopNav ? (
            <nav className="mx-auto flex items-center gap-7">
              <RoomsMegaMenu active={isActive("/rooms")} />
              {NAV_CENTER.map(({ href, key }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={t(key)}
                  active={isActive(href)}
                />
              ))}
            </nav>
          ) : (
            <div className="mx-auto hidden min-[1200px]:block" aria-hidden />
          )}

          {/* RIGHT utility cluster */}
          <div className="ml-auto flex shrink-0 items-center gap-[18px]">
            {showWideUtils ? (
              <div className="flex items-center gap-[18px]">
                <OffersIconLink active={isActive("/offers")} />
                <CurrencySwitcher />
                <LangPair />
                <AccountEntry iconOnly />
              </div>
            ) : null}

            {showWideUtils ? (
              <Link
                href="/book"
                className="btn-shine btn-primary whitespace-nowrap inline-flex"
              >
                {t("nav.book")}
              </Link>
            ) : (
              <Tooltip label={t("nav.book")}>
                <Link
                  href="/book"
                  aria-label={t("nav.book")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue text-white shadow-cta"
                >
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </Link>
              </Tooltip>
            )}

            {!showDesktopNav ? (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center"
                aria-label={t("mobile.menu")}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu className="h-6 w-6 text-ink" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <button
          type="button"
          aria-label={t("mobile.close")}
          className="fixed inset-0 z-[55] bg-ink/40"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      {/* Mobile / tablet drawer — mount only when open (keeps headlessui off critical path) */}
      {drawerOpen ? (
      <aside
        id="mobile-nav-drawer"
        className="fixed inset-y-0 right-0 z-drawer flex w-[min(100%,320px)] flex-col bg-white text-ink shadow-panel"
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
          <Logo showTag={false} size={20} className="[&_div]:text-[16px]" />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center"
            aria-label={t("mobile.close")}
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-5 w-5 text-ink" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-1">
          {DRAWER_NAV.map((item) => {
            const active = isActive(item.href);
            const subtitle = "subtitle" in item ? item.subtitle : undefined;
            const offers = "offers" in item && item.offers;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-2 border-b border-line px-4 py-3.5 transition",
                    active ? "text-blue" : "text-ink"
                  )}
                >
                  {offers ? (
                    <BadgePercent
                      className="h-4 w-4 shrink-0 text-coral-deep"
                      aria-hidden
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-[17px] font-semibold">
                      {t(item.key)}
                    </span>
                    {subtitle ? (
                      <span className="mt-0.5 block text-[12px] font-semibold text-sub">
                        {t(subtitle)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </div>
            );
          })}

          <div className="border-b border-line px-4 py-3.5">
            <div className="flex items-center gap-5">
              <CurrencySwitcher sheet />
              <LangPair />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3.5">
            <a
              href="tel:+6620000000"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blue bg-white text-[13px] font-bold text-blue"
            >
              <Phone className="h-3.5 w-3.5" />
              {t("ct.call")}
            </a>
            <a
              href="https://line.me/R/ti/p/@teakhouse"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blue bg-white text-[13px] font-bold text-blue"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {t("ct.lineBtn")}
            </a>
          </div>

          <div className="border-b border-line px-4 py-3.5">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2.5 text-[17px] font-semibold text-ink"
                >
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue text-[13px] font-bold text-white">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  {t("acc.myBookings")}
                </Link>
                <Link
                  href="/account#profile"
                  onClick={() => setDrawerOpen(false)}
                  className="block py-1.5 pl-10 text-[14px] font-semibold text-sub"
                >
                  {t("acc.profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setDrawerOpen(false);
                    router.push("/");
                  }}
                  className="block py-1.5 pl-10 text-[14px] font-semibold text-sub"
                >
                  {t("acc.signout")}
                </button>
              </div>
            ) : (
              <AccountEntry />
            )}
          </div>
        </nav>

        <div className="shrink-0 border-t border-line p-4">
          <Link
            href="/book"
            onClick={() => setDrawerOpen(false)}
            className="btn-shine btn-primary w-full whitespace-nowrap"
          >
            {t("nav.book")}
          </Link>
        </div>
      </aside>
      ) : null}
    </>
  );
}
