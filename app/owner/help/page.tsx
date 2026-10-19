"use client";

import dynamic from "next/dynamic";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

const HelpClient = dynamic(() => import("./HelpClient"), {
  ssr: false,
  loading: () => <OwnerSkeleton />,
});

export default function OwnerHelpPage() {
  return <HelpClient />;
}
