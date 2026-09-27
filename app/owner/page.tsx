"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const ExecutiveClient = dynamic(() => import("./ExecutiveClient"), { ssr: false, loading: () => <OwnerSkeleton /> });
const DashboardClient = dynamic(() => import("./DashboardClient"), { ssr: false, loading: () => <OwnerSkeleton /> });

/**
 * v15 · /owner is the executive view. The v14 dashboard (tonight's occupancy,
 * the availability grid, the six-month revenue bars) stays underneath as the
 * operations snapshot · its own header is hidden so the page reads as one.
 */
export default function OwnerDashboardPage() {
  return (
    <>
      <ExecutiveClient />
      <div className="mt-12 border-t border-white/10 pt-10 [&>div>header]:hidden">
        <DashboardClient />
      </div>
    </>
  );
}
