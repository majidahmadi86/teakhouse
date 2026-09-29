"use client";

import { OwnerProvider } from "@/lib/ownerStore";

/** Mount owner/guest room store only on routes that need live booking data. */
export function OwnerStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerProvider>{children}</OwnerProvider>;
}
