import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/location");
}

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
