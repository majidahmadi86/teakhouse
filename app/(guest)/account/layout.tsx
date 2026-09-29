import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";

export function generateMetadata(): Metadata {
  return routeMetadata("/account", { robots: { index: false, follow: false } });
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerStoreProvider>{children}</OwnerStoreProvider>;
}
