"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const PackagesClient = dynamic(() => import("./PackagesClient"), { ssr: false, loading: () => <OwnerSkeleton /> });

export default function OwnerPackagesPage() {
  return <PackagesClient />;
}
