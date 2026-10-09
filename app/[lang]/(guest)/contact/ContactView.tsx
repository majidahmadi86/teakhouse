import { PageHero } from "@/components/PageHero";
import { RiverMap } from "@/components/site/RiverMap";
import { CONTACT_PURPOSES, type ContactPurpose } from "@/lib/contactMessages";
import { t, tr } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";
import { hotelTodayIso } from "@/lib/utils";
import { sendMessage } from "./actions";

const PURPOSE_LABEL: Record<ContactPurpose, string> = {
  stay: "ct.aboutStay",
  dining: "ct.aboutDining",
  event: "ct.aboutEvent",
  other: "ct.aboutOther",
};

const ERROR_KEYS: Record<string, string> = {
  name: "ct.err.name",
  contact: "ct.err.contact",
  message: "ct.err.message",
  failed: "ct.err.failed",
};

type SearchParams = { about?: string; sent?: string; error?: string };

/**
 * Contact · a server component with a server-action form, so it sends without
 * JavaScript. Before v14 this form only showed a toast and threw the message
 * away; now it stores a ContactMessage the owner can read, tagged by purpose.
 *
 * "What is this about?" swaps ONE extra field, and it does so in pure CSS
 * (form:has(radio:checked) · see .ct-extra in globals.css), so the adaptive
 * behaviour survives with scripting off. At most five labelled fields are
 * visible at once: purpose, name, contact, the one extra, and the message.
 */
export function ContactView({
  locale,
  searchParams,
}: {
  locale: Lang;
  searchParams: SearchParams;
}) {
  const today = hotelTodayIso();
  const about = (CONTACT_PURPOSES as readonly string[]).includes(
    String(searchParams.about)
  )
    ? (searchParams.about as ContactPurpose)
    : "stay";
  const errorKey = searchParams.error ? ERROR_KEYS[searchParams.error] : undefined;

  return (
    <>
      <PageHero
        imageId="hero-contact"
        phoneImageId="hero-contact-m"
        alt={tr(locale, {
          en: "The hotel entrance: tall glass doors between white walls and timber",
          th: "ทางเข้าโรงแรม ประตูกระจกบานสูงระหว่างผนังสีขาวและไม้",
        })}
        eyebrow={t(locale, "ct.page")}
        title={t(locale, "ct.h1")}
        lead={t(locale, "ct.lead")}
      />

      <section className="bg-stone px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {searchParams.sent ? (
              <div
                role="status"
                className="rounded-card border border-line bg-forest-soft p-6 md:p-8"
              >
                <h2 className="font-display text-2xl text-ink">
                  {t(locale, "ct.sentH")}
                </h2>
                <p className="mt-3 text-[1rem] leading-relaxed text-ink/80">
                  {t(locale, "ct.sentP")}
                </p>
                <a href="/contact" className="btn-secondary mt-6 inline-flex">
                  {t(locale, "ct.sendAnother")}
                </a>
              </div>
            ) : (
              <>
                {errorKey ? (
                  <p
                    role="alert"
                    className="mb-5 rounded-card bg-coral-bg px-5 py-4 text-[0.95rem] font-semibold text-coral-deep"
                  >
                    {t(locale, errorKey)}
                  </p>
                ) : null}

                <form
                  action={sendMessage}
                  className="tkh-contact-form space-y-5 rounded-card border border-line/80 bg-white p-6 shadow-soft md:p-8"
                >
                  <fieldset>
                    <legend className="field-label">
                      {t(locale, "ct.about")}
                    </legend>
                    <div className="flex flex-wrap gap-2.5">
                      {CONTACT_PURPOSES.map((purpose) => (
                        <label
                          key={purpose}
                          className="tkh-chip cursor-pointer"
                          htmlFor={`ct-purpose-${purpose}`}
                        >
                          <input
                            id={`ct-purpose-${purpose}`}
                            type="radio"
                            name="purpose"
                            value={purpose}
                            defaultChecked={about === purpose}
                            className="sr-only"
                          />
                          <span className="tkh-chip-face inline-flex min-h-[44px] items-center rounded-soft px-4 text-[14.5px] font-medium">
                            {t(locale, PURPOSE_LABEL[purpose])}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="ct-name"
                      className="field-label"
                    >
                      {t(locale, "ct.name")}
                    </label>
                    <input
                      id="ct-name"
                      name="name"
                      required
                      minLength={2}
                      autoComplete="name"
                      className="min-h-[44px] w-full px-4 py-3"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ct-contact"
                      className="field-label"
                    >
                      {t(locale, "ct.contactField")}
                    </label>
                    <input
                      id="ct-contact"
                      name="contact"
                      required
                      minLength={4}
                      autoComplete="email"
                      placeholder="you@email.com"
                      className="min-h-[44px] w-full px-4 py-3"
                    />
                  </div>

                  {/* The one purpose-specific field · shown by CSS, so this
                      adapts with scripting off too. */}
                  <div className="ct-extra ct-extra-stay">
                    <span className="field-label">
                      {t(locale, "ct.dates")}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        aria-label={t(locale, "ct.checkIn")}
                        name="checkIn"
                        type="date"
                        min={today}
                        data-min-today=""
                        className="min-h-[44px] w-full px-4 py-3"
                      />
                      <input
                        aria-label={t(locale, "ct.checkOut")}
                        name="checkOut"
                        type="date"
                        min={today}
                        data-min-today=""
                        className="min-h-[44px] w-full px-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="ct-extra ct-extra-when">
                    <span className="field-label">
                      {t(locale, "ct.when")}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        aria-label={t(locale, "rsv.date")}
                        name="date"
                        type="date"
                        min={today}
                        data-min-today=""
                        className="min-h-[44px] w-full px-4 py-3"
                      />
                      <input
                        aria-label={t(locale, "ct.party")}
                        name="party"
                        type="number"
                        min={1}
                        max={99}
                        placeholder={t(locale, "ct.party")}
                        className="min-h-[44px] w-full px-4 py-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ct-message"
                      className="field-label"
                    >
                      {t(locale, "ct.message")}
                    </label>
                    <textarea
                      id="ct-message"
                      name="message"
                      required
                      minLength={4}
                      rows={5}
                      className="w-full px-4 py-3"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    {t(locale, "ct.send")}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="space-y-10">
            <div>
              <p className="eyebrow">{t(locale, "ct.reach")}</p>
              <p className="mt-5 font-display text-[24px] leading-snug text-ink">{t(locale, "brand.name")}</p>
              <p className="mt-2 text-[16px] leading-relaxed text-ink/75">{t(locale, "ct.address")}</p>
              <dl className="mt-6 divide-y divide-line border-y border-line text-[16px]">
                <div className="flex items-center justify-between gap-4 py-4">
                  <dt className="text-sub">{t(locale, "ct.call")}</dt>
                  <dd>
                    <a href="tel:+6620000000" className="font-medium text-ink hover:text-forest">{t(locale, "ct.phone")}</a>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <dt className="text-sub">{t(locale, "ct.mailLabel")}</dt>
                  <dd>
                    <a href="mailto:stay@teakhouse.demo" className="font-medium text-ink hover:text-forest">{t(locale, "ct.mail")}</a>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <dt className="text-sub">LINE</dt>
                  <dd className="font-medium text-ink">{t(locale, "ct.line")}</dd>
                </div>
              </dl>
            </div>
            <div className="overflow-hidden rounded-card border border-line/80 shadow-soft">
              <RiverMap
                labels={{
                  hotel: t(locale, "brand.name"),
                  river: t(locale, "map.river"),
                  pier: t(locale, "map.pier"),
                  bts: t(locale, "map.bts"),
                  road: t(locale, "map.road"),
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
