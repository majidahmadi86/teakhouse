import Link from "next/link";
import { format, parseISO } from "date-fns";
import { PageHero } from "@/components/PageHero";
import { getUpcomingEvents } from "@/lib/cachedData";
import { MAX_EVENT_GUESTS } from "@/lib/eventRequests";
import { getServerLocale, t, tr } from "@/lib/serverLocale";
import { isoDate } from "@/lib/utils";
import { requestSeats } from "./actions";

export const revalidate = 0;

const ERROR_KEYS: Record<string, string> = {
  event: "evr.err.event",
  name: "evr.err.name",
  contact: "evr.err.contact",
  guests: "evr.err.guests",
  failed: "evr.err.failed",
};

type SearchParams = {
  event?: string;
  ref?: string;
  guests?: string;
  date?: string;
  error?: string;
};

/**
 * Reserve seats at an event · a server component with a server-action form,
 * matching the table reservation flow: works with JavaScript disabled, no
 * client bundle, and the confirmation renders from the submitted values rather
 * than looking the row back up by its reference.
 */
export default async function EventReservePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = getServerLocale();
  const events = await getUpcomingEvents(isoDate(new Date()));

  const hero = (
    <PageHero
      image="/images/events/pavilion-dinner-1280.webp"
      imageAvif="/images/events/pavilion-dinner-1280.avif"
      imageWebp="/images/events/pavilion-dinner-1280.webp"
      alt="A long table laid for dinner under string lights"
      eyebrow={t(locale, "nav.events")}
      title={t(locale, "evr.h1")}
      lead={t(locale, "evr.lead")}
    />
  );

  // ── Confirmation ────────────────────────────────────────────────────────
  if (searchParams.ref) {
    const when =
      searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
        ? format(parseISO(searchParams.date), "EEEE d MMMM yyyy")
        : "";
    return (
      <>
        {hero}
        <section className="section-pad bg-white">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="eyebrow mb-3.5">{t(locale, "evr.okEyebrow")}</p>
            <h2>{t(locale, "evr.okH1")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "evr.okLead")}
            </p>
            <div className="mt-8 rounded-card border border-line bg-cloud p-6 md:p-8">
              <p className="text-[0.78rem] font-bold uppercase tracking-[0.16em] text-sub">
                {t(locale, "rsv.refLabel")}
              </p>
              <p className="mt-2 font-display text-4xl text-blue">
                {searchParams.ref}
              </p>
              <dl className="mt-6 space-y-2 text-left text-[0.95rem]">
                {when ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-sub">{t(locale, "rsv.date")}</dt>
                    <dd className="text-right font-bold text-ink">{when}</dd>
                  </div>
                ) : null}
                {searchParams.guests ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-sub">{t(locale, "evr.guests")}</dt>
                    <dd className="text-right font-bold text-ink">
                      {searchParams.guests === "1"
                        ? t(locale, "rsv.person")
                        : t(locale, "rsv.people", { n: searchParams.guests })}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <p className="mt-6 text-[0.95rem] leading-relaxed text-ink/75">
              {t(locale, "evr.okNext")}
            </p>
            <p className="mt-8">
              <Link href="/events" className="btn-secondary inline-flex">
                {t(locale, "evr.backToEvents")}
              </Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  // ── Nothing to request seats for ────────────────────────────────────────
  if (events.length === 0) {
    return (
      <>
        {hero}
        <section className="section-pad bg-white">
          <div className="mx-auto max-w-[640px] text-center">
            <h2>{t(locale, "ev.listH2")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "ev.empty")}
            </p>
            <p className="mt-8">
              <Link href="/contact" className="btn-primary inline-flex">
                {t(locale, "nav.contact")}
              </Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  const selected =
    events.find((e) => e.id === searchParams.event) ?? events[0];
  const errorKey = searchParams.error
    ? ERROR_KEYS[searchParams.error]
    : undefined;

  return (
    <>
      {hero}
      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[640px]">
          {errorKey ? (
            <p
              role="alert"
              className="mb-6 rounded-card bg-coral-bg px-5 py-4 text-[0.95rem] font-semibold text-coral-deep"
            >
              {t(locale, errorKey)}
            </p>
          ) : null}

          <form
            action={requestSeats}
            className="space-y-8 rounded-card border border-line bg-cloud p-6 md:p-8"
          >
            <fieldset className="space-y-4">
              <legend className="mb-1 font-display text-xl text-ink">
                <span className="mr-2 text-blue">1</span>
                {t(locale, "evr.step1")}
              </legend>
              <div>
                <label
                  htmlFor="evr-event"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "evr.event")}
                </label>
                <select
                  id="evr-event"
                  name="eventId"
                  required
                  defaultValue={selected.id}
                  className="min-h-[44px] w-full px-4 py-3"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {tr(locale, ev.title)} · {format(parseISO(ev.date), "d MMM yyyy")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="evr-guests"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "evr.guests")}
                </label>
                <select
                  id="evr-guests"
                  name="guests"
                  required
                  defaultValue={searchParams.guests ?? "2"}
                  className="min-h-[44px] w-full px-4 py-3"
                >
                  {Array.from({ length: MAX_EVENT_GUESTS }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n === 1
                          ? t(locale, "rsv.person")
                          : t(locale, "rsv.people", { n })}
                      </option>
                    )
                  )}
                </select>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-1 font-display text-xl text-ink">
                <span className="mr-2 text-blue">2</span>
                {t(locale, "rsv.step3")}
              </legend>
              <div>
                <label
                  htmlFor="evr-name"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.name")}
                </label>
                <input
                  id="evr-name"
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  className="min-h-[44px] w-full px-4 py-3"
                />
              </div>
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">
                  {t(locale, "rsv.contactKind")}
                </span>
                <div className="flex flex-wrap gap-5">
                  {(
                    [
                      { value: "phone", key: "rsv.kindPhone" },
                      { value: "line", key: "rsv.kindLine" },
                    ] as const
                  ).map((option, i) => (
                    <label
                      key={option.value}
                      className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[0.95rem] font-semibold text-ink"
                    >
                      <input
                        type="radio"
                        name="contactKind"
                        value={option.value}
                        defaultChecked={i === 0}
                        className="h-4 w-4 accent-blue"
                      />
                      {t(locale, option.key)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="evr-contact"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.contact")}
                </label>
                <input
                  id="evr-contact"
                  name="contact"
                  required
                  minLength={4}
                  autoComplete="tel"
                  placeholder="+66 80 000 0000"
                  className="min-h-[44px] w-full px-4 py-3"
                />
              </div>
              <div>
                <label
                  htmlFor="evr-notes"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.notes")}
                </label>
                <textarea
                  id="evr-notes"
                  name="notes"
                  rows={3}
                  placeholder={t(locale, "evr.notesHint")}
                  className="w-full px-4 py-3"
                />
              </div>
            </fieldset>

            <div>
              <button type="submit" className="btn-primary w-full">
                {t(locale, "evr.submit")}
              </button>
              <p className="mt-3 text-center text-[0.85rem] text-sub">
                {t(locale, "evr.noPayment")}
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
