"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const RatesClient = dynamic(() => import("./RatesClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerRatesPage() {
  return (
    <Suspense fallback={<OwnerSkeleton />}>
      <RatesClient />
    </Suspense>
  );
}
