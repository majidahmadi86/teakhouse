import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dining",
  description:
    "Breakfast on the river pier, a Thai kitchen and drinks at sundown at The Teak House · a riverside boutique demo by Mikaro Studio.",
  alternates: { canonical: "/dining" },
};

export default function DiningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
