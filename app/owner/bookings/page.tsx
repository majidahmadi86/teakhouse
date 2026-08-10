"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const BookingsClient = dynamic(() => import("./BookingsClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerBookingsPage() {
  return <BookingsClient />;
}
