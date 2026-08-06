"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DemoModal } from "@/components/DemoModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBookBar } from "@/components/MobileBookBar";
import { PageFade } from "@/components/motion/PageFade";
import { cn } from "@/lib/utils";

const Concierge = dynamic(
  () => import("@/components/Concierge").then((m) => m.Concierge),
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
        <PageFade>{children}</PageFade>
      </main>
      {isAuth ? null : <Footer />}
      {showMobileBookBar ? <MobileBookBar /> : null}
      {isAuth ? null : (
        <Concierge offsetForBookBar={showMobileBookBar} />
      )}
    </DemoModal>
  );
}
