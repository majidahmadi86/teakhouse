import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Spaces",
  description:
    "A riverside teak pavilion for weddings, private dinners and parties, plus special evenings on the house calendar at The Teak House · a demo by Mikaro Studio.",
  alternates: { canonical: "/events" },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
