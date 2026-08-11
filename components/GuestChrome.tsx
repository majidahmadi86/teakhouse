"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type ShellProps = { children: ReactNode; headerShell: ReactNode };

/**
 * Home: static header shell only · no GuestShell graph on LCP.
 * After idle/interaction, upgrade to full Header (with Providers).
 * Other routes: full GuestShell.
 */
export function GuestChrome({
  children,
  headerShell,
}: {
  children: ReactNode;
  headerShell: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [Shell, setShell] = useState<ComponentType<ShellProps> | null>(null);
  const [HomeHeader, setHomeHeader] = useState<ComponentType | null>(null);
  const [HomeProviders, setHomeProviders] = useState<
    ComponentType<{ children: ReactNode }> | null
  >(null);

  useEffect(() => {
    if (isHome) return;
    let cancelled = false;
    void import("@/app/(guest)/GuestShell").then((m) => {
      if (!cancelled) setShell(() => m.GuestShell);
    });
    return () => {
      cancelled = true;
    };
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const load = () => {
      void Promise.all([
        import("@/components/providers"),
        import("@/components/Header"),
      ]).then(([prov, header]) => {
        if (cancelled) return;
        setHomeProviders(() => prov.Providers);
        setHomeHeader(() => header.Header);
      });
    };

    const onInteract = () => {
      load();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 20000 });
    } else {
      timeoutId = window.setTimeout(load, 18000);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [isHome]);

  if (isHome) {
    const header =
      HomeProviders && HomeHeader ? (
        <HomeProviders>
          <HomeHeader />
        </HomeProviders>
      ) : (
        headerShell
      );
    return (
      <>
        {header}
        <main className="pb-0">{children}</main>
      </>
    );
  }

  if (!Shell) {
    return (
      <>
        {headerShell}
        <main className="pb-24 md:pb-8">{children}</main>
      </>
    );
  }

  return <Shell headerShell={headerShell}>{children}</Shell>;
}
