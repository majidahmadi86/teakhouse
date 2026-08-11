"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type ShellProps = { children: ReactNode; headerShell: ReactNode };

/**
 * Home: static header shell only · no DemoModal / Footer / Concierge graph.
 * Other guest routes: full GuestShell (separate chunk).
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

  if (isHome) {
    return (
      <>
        {headerShell}
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
