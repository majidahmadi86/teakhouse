/**
 * v14 · Guest route skeleton · the instant visual answer to a nav click.
 *
 * Shape matches what actually arrives: a hero band, then either a prose column
 * or a card grid. It is branded (navy hero, cloud cards) rather than grey
 * boxes, so the wait reads as the page arriving rather than the site breaking.
 * Pure CSS pulse · no client JS, no layout shift when the real page replaces it.
 */
export function GuestSkeleton({
  variant = "prose",
}: {
  variant?: "prose" | "cards" | "form";
}) {
  return (
    <div aria-hidden className="animate-pulse">
      {/* Hero band */}
      <div className="relative flex min-h-[52svh] items-end overflow-hidden bg-navy pb-[60px] pt-28">
        <div className="mx-auto w-full max-w-[1180px] px-6">
          <div className="h-3 w-28 rounded-full bg-gold/40" />
          <div className="mt-5 h-10 w-[min(28ch,90%)] rounded-lg bg-white/15" />
          <div className="mt-4 h-4 w-[min(46ch,95%)] rounded-full bg-white/10" />
        </div>
      </div>

      <div className="section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          {variant === "cards" ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[14px] bg-cloud shadow-card">
                  <div className="aspect-[4/3] w-full bg-line/60" />
                  <div className="p-6">
                    <div className="h-5 w-2/3 rounded bg-line/70" />
                    <div className="mt-3 h-3 w-full rounded bg-line/50" />
                    <div className="mt-2 h-3 w-5/6 rounded bg-line/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : variant === "form" ? (
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="rounded-card border border-line bg-cloud p-6 md:p-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mb-5">
                    <div className="mb-2 h-3 w-24 rounded bg-line/70" />
                    <div className="h-11 w-full rounded-[10px] bg-line/40" />
                  </div>
                ))}
                <div className="h-12 w-full rounded-full bg-line/60" />
              </div>
              <div className="space-y-6">
                <div className="h-40 rounded-card border border-line bg-white shadow-card" />
                <div className="h-72 rounded-card border border-line bg-cloud" />
              </div>
            </div>
          ) : (
            <div className="max-w-[820px]">
              <div className="h-4 w-full rounded bg-line/50" />
              <div className="mt-3 h-4 w-11/12 rounded bg-line/50" />
              <div className="mt-3 h-4 w-9/12 rounded bg-line/50" />
              <div className="mt-10 h-8 w-64 rounded bg-line/70" />
              <div className="mt-8 space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-line/50" />
                    <div className="flex-1">
                      <div className="h-4 w-1/2 rounded bg-line/60" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-line/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
