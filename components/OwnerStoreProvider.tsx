"use client";

import { OwnerProvider, type StoreScope } from "@/lib/ownerStore";

/**
 * Mount owner/guest room store only on routes that need live booking data.
 * v18 · `scope` says which: the owner panel loads the full data under its
 * session; guest pages load the guest view (no other guest's details).
 */
export function OwnerStoreProvider({
  children,
  scope = "guest",
}: {
  children: React.ReactNode;
  scope?: StoreScope;
}) {
  return <OwnerProvider scope={scope}>{children}</OwnerProvider>;
}
