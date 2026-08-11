import type { Metadata } from "next";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
import { getDemoStrings } from "@/lib/demoStrings";
import { getServerLocale } from "@/lib/serverLocale";
import { OwnerShell } from "./OwnerShell";

export const metadata: Metadata = {
  title: "Owner",
  robots: { index: false, follow: false },
  alternates: { canonical: "/owner" },
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <Providers initialLang={locale}>
      <DemoModeBar variant="owner" locale={locale} />
      <DemoModal strings={getDemoStrings(locale)}>
        <OwnerStoreProvider>
          <OwnerShell>{children}</OwnerShell>
        </OwnerStoreProvider>
      </DemoModal>
    </Providers>
  );
}
