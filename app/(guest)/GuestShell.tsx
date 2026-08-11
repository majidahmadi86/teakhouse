"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DemoModal } from "@/components/DemoModal";
import { DeferredConcierge } from "@/components/DeferredConcierge";
import { DeferredMobileBookBar } from "@/components/DeferredMobileBookBar";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { ssr: false }
);

function DeferredFooter() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    timeoutId = window.setTimeout(() => setReady(true), 2000);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <Footer />;
}

export function GuestShell({
  children,
  headerShell,
}: {
  children: React.ReactNode;
  /** Unused on non-home · kept for call-site compatibility. */
  headerShell?: ReactNode;
}) {
  void headerShell;
  const pathname = usePathname();
  const isBook = pathname === "/book";
  const isRoomDetail =
    pathname.startsWith("/rooms/") && pathname !== "/rooms";
  const isAuth =
    pathname === "/account/signin" || pathname === "/account/signup";
  const autoDemo = false;
  const showMobileBookBar = !isBook && !isRoomDetail && !isAuth;

  return (
    <DemoModal auto={autoDemo}>
      <Header />
      <main
        className={
          isBook || isRoomDetail || isAuth
            ? cn("pb-0", isRoomDetail && "bg-white")
            : "pb-24 md:pb-8"
        }
      >
        {children}
      </main>
      {isAuth ? null : <DeferredFooter />}
      {showMobileBookBar ? <DeferredMobileBookBar /> : null}
      {isAuth ? null : (
        <DeferredConcierge offsetForBookBar={showMobileBookBar} />
      )}
    </DemoModal>
  );
}
