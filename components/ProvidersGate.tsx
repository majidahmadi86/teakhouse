"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Providers = dynamic(
  () => import("@/components/providers").then((m) => m.Providers),
  { ssr: true }
);

/**
 * Home (/) skips guest providers · i18n/currency/auth stay out of the LCP bundle.
 * Other routes mount Providers (separate chunk).
 */
export function ProvidersGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return <Providers>{children}</Providers>;
}
