import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Courtyard pool, breakfast on the river pier, garden, lounge, airport transfer, daily housekeeping, and luggage storage at The Teak House — a riverside boutique demo by Mikaro Studio.",
  alternates: { canonical: "/facilities" },
};

export default function FacilitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
