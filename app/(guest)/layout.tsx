"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DemoModal } from "@/components/DemoModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBookBar } from "@/components/MobileBookBar";

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
  const autoDemo = pathname === "/";

  return (
    <DemoModal auto={autoDemo}>
      <Header />
      <main className={isBook ? "pb-8" : "pb-24 md:pb-8"}>{children}</main>
      <Footer />
      {!isBook ? <MobileBookBar /> : null}
      <Concierge />
    </DemoModal>
  );
}
