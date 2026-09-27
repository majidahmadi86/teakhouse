"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const ChannelsClient = dynamic(() => import("./ChannelsClient"), { ssr: false, loading: () => <OwnerSkeleton /> });

export default function OwnerChannelsPage() {
  return <ChannelsClient />;
}
