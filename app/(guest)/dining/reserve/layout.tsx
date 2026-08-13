import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/dining/reserve");
}

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
