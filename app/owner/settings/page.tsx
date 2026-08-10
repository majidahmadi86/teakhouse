"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const SettingsClient = dynamic(() => import("./SettingsClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerSettingsPage() {
  return <SettingsClient />;
}
