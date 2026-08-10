import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Direct",
  description:
    "Check live availability, pay a deposit, and confirm your teak room · direct booking demo by Mikaro Studio.",
  alternates: { canonical: "/book" },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
