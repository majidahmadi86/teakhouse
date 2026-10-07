import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata(): Metadata {
  return routeMetadata("/gallery");
}

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="gallery" />
      {children}
    </>
  );
}
