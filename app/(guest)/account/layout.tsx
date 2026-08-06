import type { Metadata } from "next";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerStoreProvider>{children}</OwnerStoreProvider>;
}
