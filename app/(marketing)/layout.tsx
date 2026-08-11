import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { HeaderShell } from "@/components/header/HeaderShell";
import { HomeLate } from "@/components/home/HomeLate";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/**
 * Home-only layout · server chrome + late below-fold islands.
 * No Header upgrade client on the LCP path.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoModeBar variant="guest" />
      <HeaderShell />
      <main className="pb-0">{children}</main>
      <HomeLate />
    </>
  );
}
