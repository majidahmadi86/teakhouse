import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/events/reserve");
}

export default function EventReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
