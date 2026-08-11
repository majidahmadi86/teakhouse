import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { HeaderShell } from "@/components/header/HeaderShell";
import { Providers } from "@/components/providers";
import { getServerLocale } from "@/lib/serverLocale";
import { GuestShell } from "./GuestShell";

export const metadata: Metadata = {};

/** Non-home guest routes · full providers + interactive chrome. */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <Providers initialLang={locale}>
      <DemoModeBar variant="guest" />
      <GuestShell headerShell={<HeaderShell locale={locale} />}>
        {children}
      </GuestShell>
    </Providers>
  );
}
