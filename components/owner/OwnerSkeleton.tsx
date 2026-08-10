/** Premium navy shimmer blocks · matches owner layout chrome. */
export function OwnerSkeleton() {
  return (
    <div className="own-theme space-y-8" aria-hidden>
      <div className="space-y-3">
        <div className="own-shimmer h-3 w-24 rounded-full" />
        <div className="own-shimmer h-10 w-64 max-w-full rounded-xl" />
        <div className="own-shimmer h-4 w-full max-w-md rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="own-shimmer h-28 rounded-2xl border border-white/10"
          />
        ))}
      </div>

      <div className="own-shimmer h-64 rounded-2xl border border-white/10" />
      <div className="own-shimmer h-48 rounded-2xl border border-white/10" />
    </div>
  );
}
