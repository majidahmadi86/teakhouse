import type { Metadata } from "next";
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
  return <OwnerShell>{children}</OwnerShell>;
}
