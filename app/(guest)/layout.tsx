"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DemoModal } from "@/components/DemoModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBookBar } from "@/components/MobileBookBar";
import { PageFade } from "@/components/motion/PageFade";

const Concierge = dynamic(
  () => import("@/components/Concierge").then((m) => m.Concierge),
  { ssr: false }
);

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBook = pathname === "/book";
  const isRoomDetail =
    pathname.startsWith("/rooms/") && pathname !== "/rooms";
  const autoDemo = pathname === "/";
  const showMobileBookBar = !isBook && !isRoomDetail;

  return (
    <DemoModal auto={autoDemo}>
      <Header />
      <main className={isBook || isRoomDetail ? "pb-8" : "pb-24 md:pb-8"}>
        <PageFade>{children}</PageFade>
      </main>
      <Footer />
      {showMobileBookBar ? <MobileBookBar /> : null}
      <Concierge offsetForBookBar={showMobileBookBar} />
    </DemoModal>
  );
}
