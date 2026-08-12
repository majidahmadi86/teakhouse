import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Reserve a table at The Teak House riverside kitchen · pick a date, a time and a party size, no deposit required. A demo by Mikaro Studio.",
  alternates: { canonical: "/dining/reserve" },
};

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
