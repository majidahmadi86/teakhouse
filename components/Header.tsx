"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BadgePercent,
  ChevronDown,
  Menu,
  MessageCircle,
  Phone,
  User,
  X,
} from "lucide-react";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { Logo } from "@/components/Logo";
import { SafeImage } from "@/components/SafeImage";
import { useCurrency } from "@/lib/currency";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n, type Lang } from "@/lib/i18n";
import { useGuestRooms } from "@/lib/ownerStore";
import { cn } from "@/lib/utils";

const NAV_REST = [
  { href: "/experience", key: "nav.experience" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/location", key: "nav.location" },
  { href: "/contact", key: "nav.contact" },
] as const;

function LangPair({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
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

function AccountMenu() {
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
    return (
      <Link
        href="/account/signin"
        className="inline-flex items-center gap-1.5 text-[14px] font-bold text-ink transition hover:text-blue"
      >
        <User className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span>
          {t("acc.signin")} | เข้าสู่ระบบ
        </span>
      </Link>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "G";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initial}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-popover mt-2 min-w-[180px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sky"
          >
            {t("acc.myBookings")}
          </Link>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
            className="block px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sky"
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
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-sky"
          >
            {t("acc.signout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function OffersNavLink({
  active,
  onClick,
  mobile,
}: {
  active: boolean;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  if (mobile) {
    return (
      <Link
        href="/offers"
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 border-b border-line px-4 py-5 font-display text-[1.45rem] transition",
          active ? "text-blue" : "text-ink"
        )}
      >
        <span className="relative">
          <BadgePercent
            className="h-5 w-5 text-coral-deep"
            strokeWidth={2}
            aria-hidden
          />
          {!reduce ? (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-coral-deep" />
          ) : null}
        </span>
        {t("nav.offers")}
      </Link>
    );
  }

  return (
    <Link
      href="/offers"
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-semibold transition",
        active
          ? "bg-coral-bg text-coral-deep"
          : "text-ink hover:bg-coral-bg hover:text-coral-deep"
      )}
    >
      <span className="relative">
        <BadgePercent className="h-4 w-4 text-coral-deep" aria-hidden />
        {!reduce ? (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-coral-deep" />
        ) : null}
      </span>
      {t("nav.offers")}
    </Link>
  );
}

function RoomsMegaMenu({
  active,
}: {
  active: boolean;
}) {
  const { t, tr } = useI18n();
  const { format } = useCurrency();
  const rooms = useGuestRooms();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <Link
        href="/rooms"
        className={cn(
          "group relative inline-flex items-center gap-1 text-[15px] font-semibold transition",
          active || open ? "text-blue" : "text-ink hover:text-blue"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {t("nav.rooms")}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition",
            open && "rotate-180"
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-0.5 bg-blue transition-all duration-300",
            active || open ? "w-full" : "w-0 group-hover:w-full"
          )}
        />
      </Link>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-full z-popover mt-3 w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="grid gap-5 md:grid-cols-[1fr_180px]">
              <div className="grid grid-cols-2 gap-3">
                {rooms.slice(0, 4).map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.slug}`}
                    role="menuitem"
                    className="flex gap-3 rounded-xl p-2 transition hover:bg-cloud"
                    onClick={() => setOpen(false)}
                  >
                    <div className="relative h-[54px] w-[72px] shrink-0 overflow-hidden rounded-lg">
                      <SafeImage
                        src={room.photos[0]}
                        alt={tr(room.name)}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ink">
                        {tr(room.name)}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-blue">
                        {t("room.from")} {format(room.rate)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-1 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <Link
                  href="/rooms"
                  role="menuitem"
                  className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.megaAll")}
                </Link>
                <Link
                  href="/rooms#compare"
                  role="menuitem"
                  className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.megaCompare")}
                </Link>
                <Link
                  href="/offers"
                  role="menuitem"
                  className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.megaOffers")}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
        "group relative text-[15px] font-semibold transition",
        active ? "text-blue" : "text-ink hover:text-blue"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 bg-blue transition-all duration-300",
          active ? "w-full" : "w-0 group-hover:w-full"
        )}
      />
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
  const reduce = useReducedMotion();

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
          "sticky top-0 z-50 h-14 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300 md:h-16",
          scrolled
            ? "border-line/80 bg-white/85 shadow-[0_1px_0_rgba(16,24,40,.06)] backdrop-blur-md"
            : "border-line bg-white"
        )}
      >
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

          <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
            <RoomsMegaMenu active={isActive("/rooms")} />
            <OffersNavLink active={isActive("/offers")} />
            {NAV_REST.map(({ href, key }) => (
              <NavLink
                key={href}
                href={href}
                label={t(key)}
                active={isActive(href)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <CurrencySwitcher />
              <LangPair />
              <AccountMenu />
            </div>
            <Link
              href="/book"
              className="btn-shine btn-primary hidden sm:inline-flex"
            >
              {t("nav.book")}
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center lg:hidden"
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
          className="fixed inset-0 z-[55] bg-ink/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-drawer flex w-[min(100%,360px)] flex-col bg-white text-ink shadow-panel transition-transform duration-300 lg:hidden",
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

        <nav className="flex flex-1 flex-col overflow-y-auto px-2 pt-2">
          <motion.div
            initial={reduce || !drawerOpen ? false : { opacity: 0, x: 16 }}
            animate={drawerOpen ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0, duration: 0.35 }}
          >
            <Link
              href="/rooms"
              onClick={() => setDrawerOpen(false)}
              className={cn(
                "block border-b border-line px-4 py-5 transition",
                isActive("/rooms") ? "text-blue" : "text-ink"
              )}
            >
              <span className="font-display text-[1.45rem]">{t("nav.rooms")}</span>
              <span className="mt-0.5 block text-sm font-semibold text-sub">
                {t("nav.roomsCount")}
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={reduce || !drawerOpen ? false : { opacity: 0, x: 16 }}
            animate={drawerOpen ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <OffersNavLink
              active={isActive("/offers")}
              mobile
              onClick={() => setDrawerOpen(false)}
            />
          </motion.div>

          {NAV_REST.map(({ href, key }, i) => (
            <motion.div
              key={href}
              initial={reduce || !drawerOpen ? false : { opacity: 0, x: 16 }}
              animate={drawerOpen ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: (i + 2) * 0.05, duration: 0.35 }}
            >
              <Link
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "block border-b border-line px-4 py-5 font-display text-[1.45rem] transition",
                  isActive(href) ? "text-blue" : "text-ink"
                )}
              >
                {t(key)}
              </Link>
            </motion.div>
          ))}

          <div className="mt-4 border-t border-line px-4 pt-5">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <CurrencySwitcher />
              <LangPair />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:+6620000000"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue bg-white text-sm font-bold text-blue"
              >
                <Phone className="h-4 w-4" />
                {t("ct.call")}
              </a>
              <a
                href="https://line.me/R/ti/p/@teakhouse"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue bg-white text-sm font-bold text-blue"
              >
                <MessageCircle className="h-4 w-4" />
                {t("ct.lineBtn")}
              </a>
            </div>
          </div>
        </nav>

        <div className="space-y-3 border-t border-line p-5">
          {user ? (
            <div className="space-y-1">
              <Link
                href="/account"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ink hover:bg-cloud"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue text-sm font-bold text-white">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <span>
                  <span className="block text-sm">{t("acc.myBookings")}</span>
                  <span className="block text-xs text-sub">{t("acc.profile")}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setDrawerOpen(false);
                  router.push("/");
                }}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-sub hover:bg-cloud"
              >
                {t("acc.signout")}
              </button>
            </div>
          ) : (
            <Link
              href="/account/signin"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-3 font-bold text-ink hover:bg-cloud"
            >
              <User className="h-5 w-5" />
              {t("acc.signin")} | เข้าสู่ระบบ
            </Link>
          )}
          <Link
            href="/book"
            onClick={() => setDrawerOpen(false)}
            className="btn-shine btn-primary w-full"
          >
            {t("nav.book")}
          </Link>
        </div>
      </aside>
    </>
  );
}
