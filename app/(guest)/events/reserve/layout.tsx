import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserve seats",
  description:
    "Request seats at a special evening on the house calendar at The Teak House · no payment, the house confirms. A demo by Mikaro Studio.",
  alternates: { canonical: "/events/reserve" },
};

export default function EventReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
