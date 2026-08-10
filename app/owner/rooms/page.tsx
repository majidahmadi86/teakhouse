"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const RoomsClient = dynamic(() => import("./RoomsClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerRoomsPage() {
  return <RoomsClient />;
}
