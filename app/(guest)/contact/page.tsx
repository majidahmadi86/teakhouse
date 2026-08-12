import { PageHero } from "@/components/PageHero";
import { CONTACT_PURPOSES, type ContactPurpose } from "@/lib/contactMessages";
import { getServerLocale, t } from "@/lib/serverLocale";
import { isoDate } from "@/lib/utils";
import { sendMessage } from "./actions";

export const revalidate = 0;

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
export default function ContactPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = getServerLocale();
  const today = isoDate(new Date());
  const about = (CONTACT_PURPOSES as readonly string[]).includes(
    String(searchParams.about)
  )
    ? (searchParams.about as ContactPurpose)
    : "stay";
  const errorKey = searchParams.error ? ERROR_KEYS[searchParams.error] : undefined;

  return (
    <>
      <PageHero
        image="/images/contact-hero.jpg"
        imageAvif="/images/contact-hero.avif"
        imageWebp="/images/contact-hero.webp"
        alt="Contact the house"
        eyebrow={t(locale, "ct.page")}
        title={t(locale, "ct.page")}
        lead={t(locale, "ct.lead")}
        objectPosition="center 38%"
      />

      <section className="section-pad bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-2">
          <div>
            {searchParams.sent ? (
              <div
                role="status"
                className="rounded-card border border-line bg-deal-bg p-6 md:p-8"
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
                  className="tkh-contact-form space-y-5 rounded-card border border-line bg-cloud p-6 md:p-8"
                >
                  <fieldset>
                    <legend className="mb-2.5 block text-sm font-semibold text-ink">
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
                          <span className="tkh-chip-face inline-flex min-h-[44px] items-center rounded-full px-4 text-[0.9rem] font-bold">
                            {t(locale, PURPOSE_LABEL[purpose])}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="ct-name"
                      className="mb-2 block text-sm font-semibold text-ink"
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
                      className="mb-2 block text-sm font-semibold text-ink"
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
                    <span className="mb-2 block text-sm font-semibold text-ink">
                      {t(locale, "ct.dates")}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        aria-label={t(locale, "ct.checkIn")}
                        name="checkIn"
                        type="date"
                        min={today}
                        className="min-h-[44px] w-full px-4 py-3"
                      />
                      <input
                        aria-label={t(locale, "ct.checkOut")}
                        name="checkOut"
                        type="date"
                        min={today}
                        className="min-h-[44px] w-full px-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="ct-extra ct-extra-when">
                    <span className="mb-2 block text-sm font-semibold text-ink">
                      {t(locale, "ct.when")}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        aria-label={t(locale, "rsv.date")}
                        name="date"
                        type="date"
                        min={today}
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
                      className="mb-2 block text-sm font-semibold text-ink"
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

          <div className="space-y-6">
            <div className="rounded-card border border-line bg-white p-6 shadow-card">
              <p className="text-sm font-semibold text-ink">{t(locale, "ct.address")}</p>
              <a href="tel:+6620000000" className="mt-3 block text-sm font-bold text-blue">
                {t(locale, "ct.phone")}
              </a>
              <a
                href="mailto:stay@teakhouse.demo"
                className="mt-2 block text-sm font-bold text-blue"
              >
                {t(locale, "ct.mail")}
              </a>
              <p className="mt-2 text-sm font-semibold text-sub">{t(locale, "ct.line")}</p>
            </div>
            <div className="overflow-hidden rounded-card border border-line shadow-card">
              <iframe
                title="Map"
                src="https://maps.google.com/maps?q=Charoen%20Krung%2044%20Bangkok&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
