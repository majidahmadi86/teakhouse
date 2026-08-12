import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";

export default function OwnerLoading() {
  return (
    <div className="own-theme min-h-screen bg-brand-2 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <OwnerSkeleton />
      </div>
    </div>
  );
}
