"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const DashboardClient = dynamic(() => import("./DashboardClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerDashboardPage() {
  return <DashboardClient />;
}
