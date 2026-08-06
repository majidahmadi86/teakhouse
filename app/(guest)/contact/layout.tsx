import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Write the house, call the desk, or message LINE — The Teak House riverside boutique hotel demo in Bangkok.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
