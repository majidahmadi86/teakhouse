import type { Metadata } from "next";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { GuestShell } from "./GuestShell";

/** Home defaults live in root layout; child routes set their own titles. */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerStoreProvider>
      <GuestShell>{children}</GuestShell>
    </OwnerStoreProvider>
  );
}
