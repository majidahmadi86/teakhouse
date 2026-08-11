/**
 * Server-rendered visual twin of HeroSearchPill · zero client JS.
 * Interactive logic hydrates via DeferredHeroSearch.
 */
export function HeroSearchPillShell({
  checkInLabel,
  guestLabel = "2 guests",
  checkRatesLabel = "Check rates",
  tonightLabel = "Tonight from ฿2,100",
}: {
  checkInLabel: string;
  guestLabel?: string;
  checkRatesLabel?: string;
  tonightLabel?: string;
}) {
  const compact = `${checkInLabel} · ${guestLabel}`;

  return (
    <div className="relative w-full md:max-w-[720px]">
      {/* Tonight chip · matches v7 placement */}
      <div
        className="pointer-events-none absolute -top-3 left-4 z-10 origin-bottom-left -rotate-[6deg]"
        aria-hidden
      >
        <span className="inline-flex whitespace-nowrap rounded-full bg-[#C23418] px-3 py-1 text-[13px] font-bold text-white shadow-card">
          {tonightLabel}
        </span>
      </div>

      {/* Mobile compact bar */}
      <div className="flex h-14 w-full items-center gap-3 rounded-full border border-line bg-white px-3 shadow-[0_16px_44px_rgba(10,46,92,.20)] md:hidden">
        <svg
          className="h-5 w-5 shrink-0 text-blue"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-left text-[14px] font-semibold text-ink">
          {compact}
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue text-white">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </span>
      </div>

      {/* Desktop full pill */}
      <div
        className="hidden h-[72px] items-stretch overflow-hidden rounded-full border border-line bg-white md:flex"
        style={{ boxShadow: "0 16px 44px rgba(10,46,92,.20)" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-l-full px-5">
          <svg
            className="h-5 w-5 shrink-0 text-blue"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="truncate text-[15px] font-semibold text-ink">
            {checkInLabel}
          </span>
        </div>
        <div className="my-4 w-px shrink-0 bg-line" aria-hidden />
        <div className="flex min-w-0 flex-[0.7] items-center gap-2.5 px-5">
          <svg
            className="h-5 w-5 shrink-0 text-blue"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="truncate text-[15px] font-semibold text-ink">
            {guestLabel}
          </span>
        </div>
        <div className="flex items-center pr-2.5 pl-1">
          <span className="inline-flex h-[52px] items-center gap-2 whitespace-nowrap rounded-full bg-blue px-7 text-[15px] font-bold text-white">
            {checkRatesLabel}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Default date labels for SSR · tomorrow → day after. */
export function defaultSearchDateLabel(now = new Date()): string {
  const inDate = new Date(now);
  inDate.setDate(inDate.getDate() + 1);
  const outDate = new Date(now);
  outDate.setDate(outDate.getDate() + 2);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(inDate)} – ${fmt(outDate)}`;
}
