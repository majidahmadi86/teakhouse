import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata(): Metadata {
  return routeMetadata("/location");
}

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="location" />
      {children}
    </>
  );
}
