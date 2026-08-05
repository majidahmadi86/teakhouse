"use client";

import { usePathname } from "next/navigation";
import { Concierge } from "@/components/Concierge";
import { DemoModal } from "@/components/DemoModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBookBar } from "@/components/MobileBookBar";

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
