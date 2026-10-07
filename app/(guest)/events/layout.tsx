import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { NavMark } from "@/components/site/PageMarks";

export function generateMetadata(): Metadata {
  return routeMetadata("/events");
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMark section="events" />
      {children}
    </>
  );
}
