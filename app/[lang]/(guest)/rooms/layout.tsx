import type { Metadata } from "next";
import { NavMark } from "@/components/site/PageMarks";
import { routeMetadata } from "@/lib/routeMeta";
import { pageLang, type LangParams } from "@/lib/pageLocale";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/rooms");
}

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="rooms" />
      <link
        rel="preload"
        as="image"
        href="/hero-lcp-640.avif"
        type="image/avif"
        {...{ fetchPriority: "high" }}
      />
      {children}
    </>
  );
}
