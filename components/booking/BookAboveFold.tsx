import Link from "next/link";
import { getServerLocale, t } from "@/lib/serverLocale";
import { defaultSearchDateLabel } from "@/components/hero/HeroSearchPillShell";

/**
 * Server-rendered /book above-fold · zero client JS, fully visible in the raw
 * HTML (curl it and find bk.h1 / bk.when / the stepper labels). It is used as
 * the Suspense fallback for BookPageClient: with JavaScript disabled the guest
 * still sees the real booking header, the four-step indicator and a styled date
 * shell · never a skeleton, never a blank that waits for hydration. When JS is
 * on, BookPageClient hydrates and takes over the same region with identical
 * copy, so there is no content change · only interactivity is added.
 */
export function BookAboveFold() {
  const locale = getServerLocale();
  const steps = [
    t(locale, "bk.s1"),
    t(locale, "bk.s2"),
    t(locale, "bk.s3"),
    t(locale, "bk.s4"),
  ];
  const dateLabel = defaultSearchDateLabel(locale);

  return (
    <section className="px-4 pb-16 pt-28 sm:px-6 max-lg:pb-28">
      <div className="mx-auto max-w-[1180px]">
        <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-blue">
          {t(locale, "nav.book")}
        </p>
        <h1 className="font-display text-4xl text-ink">{t(locale, "bk.h1")}</h1>
        <p className="mt-3 max-w-prose text-ink/80">{t(locale, "bk.lead")}</p>

        <nav className="my-8 flex flex-wrap gap-2" aria-label="Booking steps">
          {steps.map((label, index) => {
            const current = index === 0;
            return (
              <span
                key={label}
                className={
                  "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-[0.76rem] font-extrabold tracking-wide " +
                  (current ? "bg-blue text-white" : "bg-cloud text-strike")
                }
              >
                {label}
              </span>
            );
          })}
        </nav>

        {/* Step 1 · dates · fully styled static shell (no JS to be visible) */}
        <div className="rounded-[16px] border border-line bg-white p-6 shadow-panel">
          <h2 className="mb-6 text-2xl text-ink">{t(locale, "bk.when")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex h-14 items-center gap-3 rounded-full border border-line bg-white px-4">
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
                {dateLabel}
              </span>
            </div>
            <div className="flex h-14 items-center gap-3 rounded-full border border-line bg-white px-4">
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
                {t(locale, "g2")}
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink/70">{t(locale, "bk.cancel")}</p>
          <Link
            href="/rooms"
            prefetch={false}
            className="btn-primary btn-lift mt-6 inline-flex"
          >
            {t(locale, "bk.seeRooms")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
