import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { pageLang, type LangParams } from "@/lib/pageLocale";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/events/reserve");
}

export default function EventReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
