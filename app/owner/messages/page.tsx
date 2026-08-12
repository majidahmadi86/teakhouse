"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const MessagesClient = dynamic(() => import("./MessagesClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerMessagesPage() {
  return <MessagesClient />;
}
