import Link from "next/link";
import { LocalPicture } from "@/components/LocalPicture";
import { PageHero } from "@/components/PageHero";
import { getHotelSettingsForPage, getUpcomingEvents } from "@/lib/cachedData";
import { getContentMapForPage, localizeEvents } from "@/lib/content/localize";
import { formatDay } from "@/lib/i18n-core";
import { imageIdFor } from "@/lib/images";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { hotelTodayIso } from "@/lib/utils";

/** ISR · the list starts at today on the hotel's clock, so it refreshes hourly
 *  (and at once on an owner edit, through the events tag). */
export const revalidate = 3600;

const EVENT_TYPES = ["ev.t1", "ev.t2", "ev.t3"] as const;

const STRIP = [
  {
    base: "/images/events/pavilion-dinner",
    alt: { en: "A long table laid for dinner under string lights", th: "โต๊ะยาวจัดสำหรับมื้อค่ำใต้สายไฟระย้อย" },
  },
  {
    base: "/images/events/celebration-table",
    alt: { en: "Glasses and flowers on a table set for a celebration", th: "แก้วและดอกไม้บนโต๊ะที่จัดไว้สำหรับงานเลี้ยง" },
  },
  {
    base: "/images/events/string-lights",
    alt: { en: "String lights over the pavilion deck after sunset", th: "ไฟระย้อยเหนือนอกชานศาลาหลังพระอาทิตย์ตก" },
  },
] as const;

/**
 * Events & Spaces · a pure server component like /facilities. The special
 * events list is read from the database (owner-editable in the Events
 * manager); unpublished events never render and past dates drop off. Static
 * HTML at first paint · zero client JS, readable with JS disabled.
 */
export default async function EventsPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const todayIso = hotelTodayIso();

  // One cached read each, in parallel · both are tag-invalidated by owner saves.
  const [list, settings, content] = await Promise.all([
    getUpcomingEvents(todayIso),
    getHotelSettingsForPage(),
    getContentMapForPage(locale),
  ]);
  const events = localizeEvents(list, locale, content);

  return (
    <>
      <PageHero
        imageId={settings.eventsHeroImage ? undefined : "events/hero"}
        image={settings.eventsHeroImage || undefined}
        unoptimized={Boolean(settings.eventsHeroImage)}
        alt={tr(locale, {
          en: "A table set for dinner in the riverside pavilion under string lights",
          th: "โต๊ะอาหารค่ำในศาลาริมแม่น้ำใต้สายไฟระย้อย",
        })}
        eyebrow={t(locale, "nav.events")}
        title={t(locale, "ev.h1")}
        lead={t(locale, "ev.lead")}
      />

      {/* The function salon */}
      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[640px]">
            <p className="eyebrow mb-3.5">{t(locale, "ev.salonEyebrow")}</p>
            <h2>{t(locale, "ev.salonH2")}</h2>
            <p className="mt-5 max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
              {t(locale, "ev.salonP")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center rounded-full bg-sky px-4 py-2 text-[0.85rem] font-bold text-blue">
                {t(locale, "ev.cap")}
              </span>
              {EVENT_TYPES.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full bg-cloud px-4 py-2 text-[0.85rem] font-bold text-ink/80"
                >
                  {t(locale, key)}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact?about=event" className="btn-primary inline-flex">
                {t(locale, "ev.cta")}
              </Link>
              <a
                href="https://line.me/R/ti/p/@teakhouse"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex"
              >
                {t(locale, "ct.lineBtn")}
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {STRIP.map((photo) => (
              <div
                key={photo.base}
                className="relative aspect-[4/3] overflow-hidden rounded-[14px] shadow-card"
              >
                <LocalPicture
                  base={photo.base}
                  alt={tr(locale, photo.alt)}
                  width={640}
                  height={480}
                  sizes="(max-width: 640px) 100vw, 380px"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special events from the database */}
      <section className="section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[640px]">
            <p className="eyebrow mb-3.5">{t(locale, "ev.listEyebrow")}</p>
            <h2>{t(locale, "ev.listH2")}</h2>
          </div>

          {events.length === 0 ? (
            <p className="mt-8 max-w-prose text-[1.02rem] text-ink/75">
              {t(locale, "ev.empty")}
            </p>
          ) : (
            <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <article
                  key={ev.id}
                  className="overflow-hidden rounded-[14px] bg-white shadow-card transition hover:shadow-card-hover"
                >
                  {ev.image ? (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {imageIdFor(ev.image) ? (
                        // A house photo the seed (or the owner) picked · served
                        // through the registry: AVIF at the card's width.
                        <LocalPicture
                          base={ev.image}
                          alt={tr(locale, ev.title)}
                          width={640}
                          height={480}
                          sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={ev.image}
                          alt={tr(locale, ev.title)}
                          width={640}
                          height={480}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ) : null}
                  <div className="p-6">
                    <p className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-blue">
                      {formatDay(locale, ev.date, { year: true })}
                    </p>
                    <h3 className="mt-2 font-display text-xl text-ink">
                      {tr(locale, ev.title)}
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">
                      {tr(locale, ev.description)}
                    </p>
                    <p className="mt-5">
                      <Link
                        href={`/events/reserve?event=${encodeURIComponent(ev.id)}`}
                        className="btn-secondary inline-flex"
                      >
                        {t(locale, "evr.cta")}
                      </Link>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white px-6 py-16 text-center">
        <h2>{t(locale, "cta.h2")}</h2>
        <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
          {t(locale, "cta.p")}
        </p>
        <Link href="/book" className="btn-primary mt-8 inline-flex">
          {t(locale, "cta.btn")}
        </Link>
      </section>
    </>
  );
}
