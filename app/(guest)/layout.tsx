import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { GuestChrome } from "@/components/GuestChrome";
import { HeaderShell } from "@/components/header/HeaderShell";

/** Home defaults live in root layout; child routes set their own titles. */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoModeBar variant="guest" />
      <GuestChrome headerShell={<HeaderShell />}>{children}</GuestChrome>
    </>
  );
}
