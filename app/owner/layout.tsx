import type { Metadata } from "next";
import { DemoModeBar } from "@/components/DemoModeBar";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
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
    <>
      <DemoModeBar variant="owner" />
      <OwnerStoreProvider>
        <OwnerShell>{children}</OwnerShell>
      </OwnerStoreProvider>
    </>
  );
}
