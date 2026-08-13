import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/dining");
}

export default function DiningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
