"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  NotebookPen,
} from "lucide-react";
import { LoginScreen } from "@/components/owner/LoginScreen";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import { cn } from "@/lib/utils";

const NAV: {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { href: "/owner", labelKey: "ow.dash", icon: LayoutDashboard, exact: true },
  { href: "/owner/bookings", labelKey: "ow.bk", icon: NotebookPen },
  { href: "/owner/rooms", labelKey: "ow.rooms", icon: DoorOpen },
  { href: "/owner/calendar", labelKey: "ow.cal", icon: CalendarDays },
];

function Spinner() {
  return (
    <div className="own-theme flex min-h-screen items-center justify-center bg-brand-2">
      <Loader2 className="h-8 w-8 animate-spin text-own-blue" aria-hidden />
    </div>
  );
}

function LangToggle({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={cn(
        "flex rounded-xl border border-white/12 bg-white/5 p-1",
        compact ? "shrink-0" : "w-full"
      )}
    >
      {(["en", "th"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "rounded-lg text-sm font-extrabold uppercase transition",
            compact ? "min-h-[36px] min-w-[36px] px-2.5" : "min-h-[44px] min-w-[44px] px-3",
            lang === l
              ? "bg-own-blue text-white"
              : "text-white/60 hover:text-white"
          )}
        >
          {l === "en" ? "EN" : "ไทย"}
        </button>
      ))}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  mobile,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
        mobile ? "shrink-0 whitespace-nowrap" : "w-full",
        active
          ? "bg-own-blue/20 text-own-blue"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function OwnerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const { hydrated, isAuthed, logout, resetDemo } = useOwner();

  if (!hydrated) return <Spinner />;
  if (!isAuthed) return <LoginScreen />;

  return (
    <div className="own-theme min-h-screen bg-brand-2 text-white">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-2/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Logo light showTag={false} className="h-6 w-auto shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
            {t("ow.eyebrow")}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 pb-3">
          <LangToggle compact />
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("ow.sure"))) resetDemo();
            }}
            className="min-h-[36px] flex-1 rounded-xl border border-white/15 px-3 text-xs font-bold text-white/70 transition hover:border-own-blue/40 hover:text-white"
          >
            {t("ow.reset")}
          </button>
        </div>
        <nav
          className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Owner navigation"
        >
          {NAV.map(({ href, labelKey, icon, exact }) => (
            <NavLink
              key={href}
              href={href}
              label={t(labelKey)}
              icon={icon}
              exact={exact}
              mobile
            />
          ))}
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            {t("ow.out")}
          </button>
        </nav>
      </header>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-brand lg:fixed lg:inset-y-0 lg:flex lg:w-72">
          <div className="border-b border-white/10 px-6 py-6">
            <Logo light showTag={false} className="mb-4 h-7 w-auto" />
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
              {t("ow.eyebrow")}
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Owner navigation">
            {NAV.map(({ href, labelKey, icon, exact }) => (
              <NavLink
                key={href}
                href={href}
                label={t(labelKey)}
                icon={icon}
                exact={exact}
              />
            ))}
          </nav>

          <div className="space-y-4 border-t border-white/10 px-4 py-6">
            <LangToggle />
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("ow.sure"))) resetDemo();
              }}
              className="min-h-[44px] w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-own-blue/40 hover:text-white"
            >
              {t("ow.reset")}
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] items-center text-sm font-semibold text-white/50 transition hover:text-white"
            >
              {t("ow.back")}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              {t("ow.out")}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-h-screen flex-1 lg:ml-72">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
