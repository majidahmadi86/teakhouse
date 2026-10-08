import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { pageLang, type LangParams } from "@/lib/pageLocale";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/dining/reserve");
}

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
