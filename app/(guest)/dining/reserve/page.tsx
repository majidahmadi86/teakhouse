import Link from "next/link";
import { format, parseISO } from "date-fns";
import { PageHero } from "@/components/PageHero";
import { getHotelSettings } from "@/lib/cachedData";
import {
  formatServiceWindow,
  serviceSlots,
  type ValidationError,
} from "@/lib/reservations";
import { getServerLocale, t } from "@/lib/serverLocale";
import { isoDate } from "@/lib/utils";
import { reserveTable } from "./actions";

export const revalidate = 0;

const ERROR_KEYS: Record<string, string> = {
  date: "rsv.err.date",
  time: "rsv.err.time",
  party: "rsv.err.party",
  name: "rsv.err.name",
  contact: "rsv.err.contact",
  closed: "rsv.err.closed",
  failed: "rsv.err.failed",
};

type SearchParams = {
  ref?: string;
  date?: string;
  time?: string;
  party?: string;
  error?: string;
};

/**
 * Reserve a table · a server component with a server-action form, so it works
 * with JavaScript disabled (real POST, server redirect) and upgrades to a
 * client transition when React is present. No client bundle for the flow.
 *
 * Three screens live at this one route: the form, the confirmation (?ref=),
 * and the closed notice when the owner has switched reservations off. The
 * confirmation renders from the submitted values in the query string and never
 * reads the row back by reference · a four-character ref must not become an
 * enumerable handle to a guest's name and phone number.
 */
export default async function ReservePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = getServerLocale();
  // Cached + tag-invalidated · this page was still paying a database round
  // trip per request while /dining next door had stopped.
  const settings = await getHotelSettings();
  const slots = serviceSlots(settings.serviceStart, settings.serviceEnd);
  const today = isoDate(new Date());
  const window = formatServiceWindow(settings.serviceStart, settings.serviceEnd);

  const hero = (
    <PageHero
      image="/images/dining/reserve-1280.webp"
      imageAvif="/images/dining/reserve-1280.avif"
      imageWebp="/images/dining/reserve-1280.webp"
      alt="A table laid for dinner beside the river"
      eyebrow={t(locale, "nav.dining")}
      title={t(locale, "rsv.h1")}
      lead={t(locale, "rsv.lead")}
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
            <p className="eyebrow mb-3.5">{t(locale, "rsv.okEyebrow")}</p>
            <h2>{t(locale, "rsv.okH1")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "rsv.okLead")}
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
                    <dt className="font-semibold text-sub">
                      {t(locale, "rsv.date")}
                    </dt>
                    <dd className="text-right font-bold text-ink">{when}</dd>
                  </div>
                ) : null}
                {searchParams.time ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-sub">
                      {t(locale, "rsv.time")}
                    </dt>
                    <dd className="text-right font-bold text-ink">
                      {searchParams.time}
                    </dd>
                  </div>
                ) : null}
                {searchParams.party ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-sub">
                      {t(locale, "rsv.party")}
                    </dt>
                    <dd className="text-right font-bold text-ink">
                      {searchParams.party === "1"
                        ? t(locale, "rsv.person")
                        : t(locale, "rsv.people", { n: searchParams.party })}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <p className="mt-6 text-[0.95rem] leading-relaxed text-ink/75">
              {t(locale, "rsv.okNext")}
            </p>
            <p className="mt-8">
              <Link href="/dining" className="btn-secondary inline-flex">
                {t(locale, "rsv.backToMenu")}
              </Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  // ── Reservations switched off ───────────────────────────────────────────
  if (!settings.reservationsEnabled) {
    return (
      <>
        {hero}
        <section className="section-pad bg-white">
          <div className="mx-auto max-w-[640px] text-center">
            <h2>{t(locale, "rsv.closedH1")}</h2>
            <p className="mt-4 text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "rsv.closedP")}
            </p>
            <p className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary inline-flex">
                {t(locale, "nav.contact")}
              </Link>
              <Link href="/dining" className="btn-secondary inline-flex">
                {t(locale, "rsv.backToMenu")}
              </Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  const errorKey = searchParams.error
    ? ERROR_KEYS[searchParams.error as ValidationError]
    : undefined;

  // ── The form ───────────────────────────────────────────────────────────
  return (
    <>
      {hero}
      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[640px]">
          <p className="inline-flex items-center rounded-full bg-sky px-4 py-2.5 text-[0.85rem] font-bold text-blue">
            {t(locale, "rsv.window", { w: window })}
          </p>

          {errorKey ? (
            <p
              role="alert"
              className="mt-6 rounded-card bg-coral-bg px-5 py-4 text-[0.95rem] font-semibold text-coral-deep"
            >
              {t(locale, errorKey)}
            </p>
          ) : null}

          <form
            action={reserveTable}
            className="mt-6 space-y-8 rounded-card border border-line bg-cloud p-6 md:p-8"
          >
            <fieldset className="space-y-4">
              <legend className="mb-1 font-display text-xl text-ink">
                <span className="mr-2 text-blue">1</span>
                {t(locale, "rsv.step1")}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rsv-date"
                    className="mb-2 block text-sm font-semibold text-ink"
                  >
                    {t(locale, "rsv.date")}
                  </label>
                  <input
                    id="rsv-date"
                    name="date"
                    type="date"
                    required
                    min={today}
                    defaultValue={searchParams.date ?? today}
                    className="min-h-[44px] w-full px-4 py-3"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rsv-time"
                    className="mb-2 block text-sm font-semibold text-ink"
                  >
                    {t(locale, "rsv.time")}
                  </label>
                  <select
                    id="rsv-time"
                    name="time"
                    required
                    defaultValue={searchParams.time ?? slots[0]}
                    className="min-h-[44px] w-full px-4 py-3"
                  >
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-1 font-display text-xl text-ink">
                <span className="mr-2 text-blue">2</span>
                {t(locale, "rsv.step2")}
              </legend>
              <div>
                <label
                  htmlFor="rsv-party"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.party")}
                </label>
                <select
                  id="rsv-party"
                  name="party"
                  required
                  defaultValue={searchParams.party ?? "2"}
                  className="min-h-[44px] w-full px-4 py-3"
                >
                  {Array.from({ length: settings.maxPartySize }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n === 1
                          ? t(locale, "rsv.person")
                          : t(locale, "rsv.people", { n })}
                      </option>
                    )
                  )}
                </select>
                <p className="mt-2 text-[0.85rem] text-sub">
                  {t(locale, "rsv.partyHint", { n: settings.maxPartySize })}
                </p>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-1 font-display text-xl text-ink">
                <span className="mr-2 text-blue">3</span>
                {t(locale, "rsv.step3")}
              </legend>
              <div>
                <label
                  htmlFor="rsv-name"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.name")}
                </label>
                <input
                  id="rsv-name"
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
                  htmlFor="rsv-contact"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.contact")}
                </label>
                <input
                  id="rsv-contact"
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
                  htmlFor="rsv-notes"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  {t(locale, "rsv.notes")}
                </label>
                <textarea
                  id="rsv-notes"
                  name="notes"
                  rows={3}
                  placeholder={t(locale, "rsv.notesHint")}
                  className="w-full px-4 py-3"
                />
              </div>
            </fieldset>

            <div>
              <button type="submit" className="btn-primary w-full">
                {t(locale, "rsv.submit")}
              </button>
              <p className="mt-3 text-center text-[0.85rem] text-sub">
                {t(locale, "rsv.noDeposit")}
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
