import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { HeaderShell } from "@/components/header/HeaderShell";
import { HomeHeaderUpgrade } from "@/components/home/HomeHeaderUpgrade";
import { HomeLate } from "@/components/home/HomeLate";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/**
 * Home layout · SSR HeaderShell (logo + Rooms trigger) · upgrades to full
 * Header with Rooms mega-menu on interaction / hover.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoModeBar variant="guest" />
      <HomeHeaderUpgrade shell={<HeaderShell />} />
      <main className="pb-0">{children}</main>
      <HomeLate />
    </>
  );
}
