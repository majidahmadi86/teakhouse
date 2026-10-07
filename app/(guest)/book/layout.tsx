import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { ChromeMark } from "@/components/site/PageMarks";

export function generateMetadata(): Metadata {
  return routeMetadata("/book");
}

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerStoreProvider>
      {/* /book is the booking flow · no second Book bar under it. */}
      <ChromeMark noBookBar flushMain />
      {children}
    </OwnerStoreProvider>
  );
}
