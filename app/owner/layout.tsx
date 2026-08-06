import type { Metadata } from "next";
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
    <OwnerStoreProvider>
      <OwnerShell>{children}</OwnerShell>
    </OwnerStoreProvider>
  );
}
