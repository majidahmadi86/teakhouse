import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/offers");
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
