"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  NotebookPen,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import { cn } from "@/lib/utils";

const LoginScreen = dynamic(
  () =>
    import("@/components/owner/LoginScreen").then((m) => m.LoginScreen),
  { ssr: false }
);

const NAV: {
  href: string;
  labelKey?: string;
  label?: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { href: "/owner", labelKey: "ow.dash", icon: LayoutDashboard, exact: true },
  { href: "/owner/bookings", labelKey: "ow.bk", icon: NotebookPen },
  { href: "/owner/rooms", labelKey: "ow.rooms", icon: DoorOpen },
  { href: "/owner/calendar", labelKey: "ow.cal", icon: CalendarDays },
  { href: "/owner/settings", label: "Settings", icon: Settings },
];

const LG_QUERY = "(min-width: 1024px)";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

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
        "flex rounded-xl border border-white/10 bg-white/5 p-1",
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
            compact
              ? "min-h-[36px] min-w-[36px] px-2.5"
              : "min-h-[44px] min-w-[44px] px-3",
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

function OwnerNavList({
  mobile,
  t,
}: {
  mobile?: boolean;
  t: (key: string) => string;
}) {
  return (
    <>
      {NAV.map(({ href, labelKey, label, icon, exact }) => (
        <NavLink
          key={href}
          href={href}
          label={label ?? (labelKey ? t(labelKey) : href)}
          icon={icon}
          exact={exact}
          mobile={mobile}
        />
      ))}
    </>
  );
}

export function OwnerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const { hydrated, isAuthed, logout, resetDemo } = useOwner();
  const isDesktop = useIsDesktop();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!hydrated || isDesktop === null) return <Spinner />;
  if (!isAuthed && !demoMode) return <LoginScreen />;

  const onReset = () => {
    if (window.confirm(t("ow.sure"))) resetDemo();
  };

  return (
    <div
      className={cn(
        "own-theme min-h-screen bg-brand-2 text-white",
        isDesktop && "flex"
      )}
    >
      {isDesktop ? (
        <aside
          className="sticky top-[var(--demo-bar-h)] z-30 flex h-[calc(100dvh-var(--demo-bar-h))] w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-brand"
          aria-label="Owner sidebar"
        >
          <div className="shrink-0 border-b border-white/10 px-6 py-6">
            <Logo light showTag={false} className="mb-4 h-7 w-auto" />
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
              {t("ow.eyebrow")}
            </p>
          </div>

          <nav
            className="flex flex-1 flex-col space-y-1 px-4 py-6"
            aria-label="Owner navigation"
          >
            <OwnerNavList t={t} />
          </nav>

          <div className="mt-auto space-y-4 border-t border-white/10 px-4 py-6">
            <LangToggle />
            <button
              type="button"
              onClick={onReset}
              className="min-h-[44px] w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-own-blue/40 hover:text-white"
            >
              {t("ow.reset")}
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] items-center text-sm font-semibold text-white/60 transition hover:text-white"
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
      ) : (
        <header className="sticky top-[var(--demo-bar-h)] z-40 border-b border-white/10 bg-brand-2/95 backdrop-blur-md">
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
              onClick={onReset}
              className="min-h-[36px] flex-1 rounded-xl border border-white/10 px-3 text-xs font-bold text-white/70 transition hover:border-own-blue/40 hover:text-white"
            >
              {t("ow.reset")}
            </button>
            <Link
              href="/"
              className="min-h-[36px] shrink-0 rounded-xl px-2 text-xs font-semibold text-white/60 transition hover:text-white"
            >
              {t("ow.back")}
            </Link>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Owner navigation"
          >
            <OwnerNavList t={t} mobile />
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
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
