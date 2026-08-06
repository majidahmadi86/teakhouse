import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Teak interiors, courtyard pool, Chao Phraya views, and house dining — browse the Teak House photo gallery.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
