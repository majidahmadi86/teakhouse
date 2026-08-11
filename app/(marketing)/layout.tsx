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
 * Home-only layout · no i18n/currency providers on the server tree.
 * Header + below-fold mount after 15s / interaction.
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
