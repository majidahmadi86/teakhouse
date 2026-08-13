import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";

export function generateMetadata(): Metadata {
  return routeMetadata("/offers");
}

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
