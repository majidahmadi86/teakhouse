import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/rooms");
}

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
