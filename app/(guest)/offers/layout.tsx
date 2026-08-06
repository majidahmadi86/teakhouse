import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers",
  description:
    "Direct-only stays: longer nights, breakfast bundles, and seasonal river packages. Book at The Teak House demo hotel.",
  alternates: { canonical: "/offers" },
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
