"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const DeskClient = dynamic(() => import("./DeskClient"), { ssr: false, loading: () => <OwnerSkeleton /> });

export default function OwnerDeskPage() {
  return <DeskClient />;
}
