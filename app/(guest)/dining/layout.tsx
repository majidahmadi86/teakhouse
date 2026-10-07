import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata(): Metadata {
  return routeMetadata("/dining");
}

export default function DiningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="dining" />
      {children}
    </>
  );
}
