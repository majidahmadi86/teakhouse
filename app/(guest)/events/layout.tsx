import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/events");
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
