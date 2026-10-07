import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata(): Metadata {
  return routeMetadata("/offers");
}

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="offers" />
      {children}
    </>
  );
}
