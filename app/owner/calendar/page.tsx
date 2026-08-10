"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const CalendarClient = dynamic(() => import("./CalendarClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerCalendarPage() {
  return <CalendarClient />;
}
