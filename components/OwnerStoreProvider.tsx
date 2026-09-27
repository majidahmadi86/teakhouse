"use client";

import { OwnerProvider, type StoreScope } from "@/lib/ownerStore";

/**
 * Mount the live store only on routes that need it. The guest scope carries
 * rooms, rate rules and packages · never bookings.
 */
export function OwnerStoreProvider({
  children,
  scope = "owner",
}: {
  children: React.ReactNode;
  scope?: StoreScope;
}) {
  return <OwnerProvider scope={scope}>{children}</OwnerProvider>;
}
