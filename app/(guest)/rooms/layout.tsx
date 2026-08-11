import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms",
  alternates: { canonical: "/rooms" },
};

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-640.avif"
        type="image/avif"
        {...{ fetchPriority: "high" }}
      />
      {children}
    </>
  );
}
