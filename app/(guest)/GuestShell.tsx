"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DemoModal } from "@/components/DemoModal";
import { Header } from "@/components/Header";
import { deferHeavy } from "@/lib/deferHeavy";
import { cn } from "@/lib/utils";

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { ssr: false }
);

const MobileBookBar = dynamic(
  () => import("@/components/MobileBookBar").then((m) => m.MobileBookBar),
  { ssr: false }
);

const Concierge = dynamic(
  () => import("@/components/Concierge").then((m) => m.Concierge),
  { ssr: false }
);

export function GuestShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [chromeReady, setChromeReady] = useState(false);
  const isBook = pathname === "/book";
  const isRoomDetail =
    pathname.startsWith("/rooms/") && pathname !== "/rooms";
  const isAuth =
    pathname === "/account/signin" || pathname === "/account/signup";
  const autoDemo = pathname === "/";
  const showMobileBookBar = !isBook && !isRoomDetail && !isAuth;

  useEffect(() => deferHeavy(() => setChromeReady(true), 10000), []);

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
      {chromeReady && !isAuth ? <Footer /> : null}
      {chromeReady && showMobileBookBar ? <MobileBookBar /> : null}
      {chromeReady && !isAuth ? (
        <Concierge offsetForBookBar={showMobileBookBar} />
      ) : null}
    </DemoModal>
  );
}
