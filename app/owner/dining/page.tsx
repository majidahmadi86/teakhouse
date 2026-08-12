"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const DiningClient = dynamic(() => import("./DiningClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerDiningPage() {
  return <DiningClient />;
}
