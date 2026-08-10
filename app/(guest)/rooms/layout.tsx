import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms",
  description:
    "Four teak rooms on the Chao Phraya · River Loft, Teak Suite, Garden Room, and Courtyard Twin. Compare rates and book direct.",
  alternates: { canonical: "/rooms" },
};

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
