"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DemoModal } from "@/components/DemoModal";
import { DeferredConcierge } from "@/components/DeferredConcierge";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { ssr: false }
);

const MobileBookBar = dynamic(
  () => import("@/components/MobileBookBar").then((m) => m.MobileBookBar),
  { ssr: false }
);

export function GuestShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBook = pathname === "/book";
  const isRoomDetail =
    pathname.startsWith("/rooms/") && pathname !== "/rooms";
  const isAuth =
    pathname === "/account/signin" || pathname === "/account/signup";
  const autoDemo = pathname === "/";
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
      {isAuth ? null : <Footer />}
      {showMobileBookBar ? <MobileBookBar /> : null}
      {isAuth ? null : (
        <DeferredConcierge offsetForBookBar={showMobileBookBar} />
      )}
    </DemoModal>
  );
}
