import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/facilities");
}

export default function FacilitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
