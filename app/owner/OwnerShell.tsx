"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ConciergeBell,
  DoorOpen,
  Inbox,
  Loader2,
  LogOut,
  NotebookPen,
  PartyPopper,
  Radio,
  Settings,
  Sparkles,
  Tags,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ROLES, SECTION_PERMISSION, type Role } from "@/lib/auth/rbac";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import { StaffProvider, useStaff } from "@/lib/staffSession";
import { cn } from "@/lib/utils";

const LoginScreen = dynamic(() => import("@/components/owner/LoginScreen").then((m) => m.LoginScreen), { ssr: false });

/**
 * v15 · Two portals in one shell.
 *
 *   Executive  · /owner (analytics, payouts, reports) · owner, manager
 *   Operations · /owner/desk (arrivals, housekeeping, requests) · everyone
 *
 * The sidebar shows only what the signed-in role may open, and the route guard
 * bounces a role that types a URL it may not see to its own home.
 */
const NAV: { href: string; labelKey: string; icon: typeof BarChart3; exact?: boolean; group: "exec" | "ops" | "house" }[] = [
  { href: "/owner", labelKey: "ow.exec", icon: BarChart3, exact: true, group: "exec" },
  { href: "/owner/desk", labelKey: "ow.desk", icon: ConciergeBell, group: "ops" },
  { href: "/owner/bookings", labelKey: "ow.bk", icon: NotebookPen, group: "ops" },
  { href: "/owner/calendar", labelKey: "ow.cal", icon: CalendarDays, group: "ops" },
  { href: "/owner/messages", labelKey: "ow.messages", icon: Inbox, group: "ops" },
  { href: "/owner/rooms", labelKey: "ow.rooms", icon: DoorOpen, group: "house" },
  { href: "/owner/rates", labelKey: "ow.rateCalendar", icon: Tags, group: "house" },
  { href: "/owner/packages", labelKey: "ow.packages", icon: Sparkles, group: "house" },
  { href: "/owner/dining", labelKey: "ow.dining", icon: UtensilsCrossed, group: "house" },
  { href: "/owner/events", labelKey: "ow.events", icon: PartyPopper, group: "house" },
  { href: "/owner/channels", labelKey: "ow.channels", icon: Radio, group: "exec" },
  { href: "/owner/settings", labelKey: "ow.settings", icon: Settings, group: "exec" },
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
    <div className={cn("owner-inset flex rounded-xl p-1", compact ? "shrink-0" : "w-full")}>
      {(["en", "th"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "rounded-lg text-sm font-extrabold uppercase transition",
            compact ? "min-h-[44px] min-w-[44px] px-2.5" : "min-h-[44px] min-w-[44px] px-3",
            lang === l ? "bg-own-blue text-white" : "text-white/60 hover:text-white"
          )}
        >
          {l === "en" ? "EN" : "ไทย"}
        </button>
      ))}
    </div>
  );
}

/** DEMO · sign in as any seeded role to see what that role sees. */
function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const { me, switchRole, home } = useStaff();
  const router = useRouter();
  const [busy, setBusy] = useState<Role | null>(null);
  if (!me?.demo) return null;
  return (
    <div className={cn("owner-inset rounded-xl p-2", compact ? "flex gap-1 overflow-x-auto" : "grid grid-cols-2 gap-1")} data-role-switcher>
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy(role);
            const ok = await switchRole(role);
            setBusy(null);
            if (ok) router.push(home);
          }}
          className={cn(
            "min-h-[36px] whitespace-nowrap rounded-lg px-2 text-[0.7rem] font-extrabold uppercase tracking-wide transition",
            me.role === role ? "bg-gold/25 text-gold" : "text-white/55 hover:bg-white/5 hover:text-white"
          )}
          data-role={role}
        >
          {busy === role ? "…" : t(`ow.role.${role}`)}
        </button>
      ))}
    </div>
  );
}

function NavLink({ href, label, icon: Icon, exact, mobile }: { href: string; label: string; icon: typeof BarChart3; exact?: boolean; mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = exact ? pathname === href : pathname.startsWith(href);
  const warm = () => router.prefetch(href);
  return (
    <Link
      href={href}
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
      className={cn(
        "flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
        mobile ? "shrink-0 whitespace-nowrap" : "w-full",
        active ? "bg-own-blue/20 text-own-blue" : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function OwnerNavList({ mobile }: { mobile?: boolean }) {
  const { t } = useI18n();
  const { can } = useStaff();
  const visible = NAV.filter((item) => {
    const perm = SECTION_PERMISSION[item.href];
    if (item.href === "/owner") return can("analytics:read");
    return perm ? can(perm) : true;
  });
  return (
    <>
      {visible.map(({ href, labelKey, icon, exact }) => (
        <NavLink key={href} href={href} label={t(labelKey)} icon={icon} exact={exact} mobile={mobile} />
      ))}
    </>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { hydrated, resetDemo } = useOwner();
  const { me, loading, needsLogin, can, home, logout } = useStaff();
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const router = useRouter();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Route guard · a role that opens a section it may not see goes home.
  useEffect(() => {
    if (!me) return;
    const section = Object.keys(SECTION_PERMISSION)
      .filter((p) => p !== "/owner")
      .find((p) => pathname.startsWith(p));
    const perm = section ? SECTION_PERMISSION[section] : pathname === "/owner" ? "analytics:read" : null;
    if (perm && !can(perm)) router.replace(home);
  }, [me, pathname, can, home, router]);

  if (loading || !hydrated || isDesktop === null) return <Spinner />;
  if (needsLogin) return <LoginScreen />;

  const onReset = () => {
    if (window.confirm(t("ow.sure"))) resetDemo();
  };
  const onLogout = () => {
    void logout().then(() => router.push("/"));
  };
  const whoami = me ? (me.sandbox ? t("ow.sandboxActor") : `${me.name} · ${t(`ow.role.${me.role}`)}`) : "";

  return (
    <div className={cn("own-theme min-h-screen bg-brand-2 text-white", isDesktop && "flex")}>
      {isDesktop ? (
        <aside
          className="sticky top-[var(--demo-bar-h)] z-sticky flex h-[calc(100dvh-var(--demo-bar-h))] w-72 shrink-0 flex-col overflow-y-auto bg-brand shadow-[8px_0_32px_rgba(0,0,0,.35)]"
          aria-label={t("ow.a11y.sidebar")}
        >
          <div className="owner-split-b shrink-0 px-6 py-6">
            <Logo light showTag={false} className="mb-4 h-7 w-auto" />
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">{t("ow.eyebrow")}</p>
            <p className="mt-1.5 truncate text-[0.72rem] font-semibold text-white/60" data-whoami>
              {whoami}
            </p>
            {demoMode ? <p className="mt-1 text-[0.68rem] font-semibold text-white/45">{t("ow.demoData")}</p> : null}
          </div>

          <nav className="flex flex-1 flex-col space-y-1 px-4 py-6" aria-label={t("ow.a11y.nav")}>
            <OwnerNavList />
          </nav>

          <div className="owner-split-t mt-auto space-y-4 px-4 py-6">
            <RoleSwitcher />
            <LangToggle />
            {can("settings:write") ? (
              <button
                type="button"
                onClick={onReset}
                className="owner-control min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-bold text-white/70 transition hover:text-white"
              >
                {t("ow.reset")}
              </button>
            ) : null}
            <Link href="/" className="flex min-h-[44px] items-center text-sm font-semibold text-white/60 transition hover:text-white">
              {t("ow.back")}
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              {t("ow.out")}
            </button>
          </div>
        </aside>
      ) : (
        <header className="sticky top-[var(--demo-bar-h)] z-header bg-brand-2/95 shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo light showTag={false} className="h-6 w-auto shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">{t("ow.eyebrow")}</span>
            <span className="ml-auto truncate text-[0.66rem] font-semibold text-white/60" data-whoami>
              {whoami}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 pb-3">
            <LangToggle compact />
            <RoleSwitcher compact />
            <Link href="/" className="ml-auto min-h-[44px] shrink-0 rounded-xl px-2 text-xs font-semibold text-white/60 transition hover:text-white">
              {t("ow.back")}
            </Link>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t("ow.a11y.nav")}
          >
            <OwnerNavList mobile />
            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              {t("ow.out")}
            </button>
          </nav>
        </header>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <ShellInner>{children}</ShellInner>
    </StaffProvider>
  );
}
