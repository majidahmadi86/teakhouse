import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";

export function generateMetadata(): Metadata {
  return routeMetadata("/book");
}

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerStoreProvider>{children}</OwnerStoreProvider>;
}
