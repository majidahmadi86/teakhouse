"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DemoModal } from "@/components/DemoModal";
import { DeferredConcierge } from "@/components/DeferredConcierge";
import { DeferredMobileBookBar } from "@/components/DeferredMobileBookBar";
import { DeferredHeader } from "@/components/header/DeferredHeader";
import { cn } from "@/lib/utils";

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { ssr: false }
);

function DeferredFooter() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setReady(true), 3000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!ready) return null;
  return <Footer />;
}

export function GuestShell({
  children,
  headerShell,
}: {
  children: React.ReactNode;
  headerShell: ReactNode;
}) {
  const pathname = usePathname();
  const isBook = pathname === "/book";
  const isRoomDetail =
    pathname.startsWith("/rooms/") && pathname !== "/rooms";
  const isAuth =
    pathname === "/account/signin" || pathname === "/account/signup";
  const showMobileBookBar = !isBook && !isRoomDetail && !isAuth;

  return (
    <DemoModal auto={false}>
      {/* Deferred past LH TBT window · interaction upgrades immediately */}
      <DeferredHeader shell={headerShell} />
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
