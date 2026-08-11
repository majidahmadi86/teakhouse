"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { DemoModal } from "@/components/DemoModal";
import { DeferredConcierge } from "@/components/DeferredConcierge";
import { DeferredMobileBookBar } from "@/components/DeferredMobileBookBar";
import { DeferredHeader } from "@/components/header/DeferredHeader";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

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
      {isAuth ? null : <Footer />}
      {showMobileBookBar ? <DeferredMobileBookBar /> : null}
      {isAuth ? null : (
        <DeferredConcierge
          offsetForBookBar={showMobileBookBar}
          onBook={isBook || isRoomDetail}
        />
      )}
    </DemoModal>
  );
}
