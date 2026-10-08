import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/experience");
}

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="experience" />
      {children}
    </>
  );
}
