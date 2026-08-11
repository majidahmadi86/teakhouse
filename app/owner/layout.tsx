import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
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
      <DemoModeBar variant="owner" />
      <OwnerStoreProvider>
        <OwnerShell>{children}</OwnerShell>
      </OwnerStoreProvider>
    </Providers>
  );
}
