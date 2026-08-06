import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "River life, courtyard pool, spa mornings, and Bangkok walks from The Teak House — a riverside boutique demo by Mikaro Studio.",
  alternates: { canonical: "/experience" },
};

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
