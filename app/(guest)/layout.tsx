import type { Metadata } from "next";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { HeaderShell } from "@/components/header/HeaderShell";
import { Providers } from "@/components/providers";
import { getDemoStrings } from "@/lib/demoStrings";
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
      <DemoModeBar variant="guest" locale={locale} />
      <DemoModal strings={getDemoStrings(locale)}>
        <GuestShell headerShell={<HeaderShell locale={locale} />}>
          {children}
        </GuestShell>
      </DemoModal>
    </Providers>
  );
}
