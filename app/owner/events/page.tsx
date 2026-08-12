"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const EventsClient = dynamic(() => import("./EventsClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerEventsPage() {
  return <EventsClient />;
}
