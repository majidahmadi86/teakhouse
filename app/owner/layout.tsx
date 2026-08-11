import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
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
  return (
    <Providers>
      <DemoModeBar variant="owner" />
      <OwnerStoreProvider>
        <OwnerShell>{children}</OwnerShell>
      </OwnerStoreProvider>
    </Providers>
  );
}
