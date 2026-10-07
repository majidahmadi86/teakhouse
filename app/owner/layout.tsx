import type { Metadata } from "next";
import { DemoModal } from "@/components/DemoModal";
import { DemoModeBar } from "@/components/DemoModeBar";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { OwnerProviders } from "@/components/OwnerProviders";
import { getDemoStrings } from "@/lib/demoStrings";
import { getServerLocale, t } from "@/lib/serverLocale";
import { OwnerShell } from "./OwnerShell";

export function generateMetadata(): Metadata {
  return {
    title: t(getServerLocale(), "db.owner"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/owner" },
  };
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <OwnerProviders initialLang={locale}>
      <DemoModeBar variant="owner" locale={locale} />
      <DemoModal strings={getDemoStrings(locale)}>
        <OwnerStoreProvider>
          <OwnerShell>{children}</OwnerShell>
        </OwnerStoreProvider>
      </DemoModal>
    </OwnerProviders>
  );
}
