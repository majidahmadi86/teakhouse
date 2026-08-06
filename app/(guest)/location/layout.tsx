import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location",
  description:
    "Charoen Krung riverside Bangkok — minutes to ferries, old town, and the Chao Phraya. Find The Teak House demo hotel.",
  alternates: { canonical: "/location" },
};

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
