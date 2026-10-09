import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Picture } from "@/components/Picture";
import { getHotelSettingsForPage, getUpcomingEvents } from "@/lib/cachedData";
import { getContentMapForPage, localizeEvents } from "@/lib/content/localize";
import { formatDay } from "@/lib/i18n-core";
import { isImageId, type ImageId } from "@/lib/images";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { hotelTodayIso } from "@/lib/utils";

/** ISR · the list starts at today on the hotel's clock, so it refreshes hourly
 *  (and at once on an owner edit, through the events tag). */
export const revalidate = 3600;

const EVENT_TYPES = ["ev.t1", "ev.t2", "ev.t3"] as const;

const SPACES: { id: ImageId; alt: { en: string; th: string }; h: string; p: string }[] = [
  {
    id: "events-strip-wedding",
    alt: {
      en: "A garden ceremony set with an arch of greenery and white flowers",
      th: "พิธีในสวนจัดด้วยซุ้มต้นไม้เขียวและดอกไม้สีขาว",
    },
    h: "ev.space1.h",
    p: "ev.space1.p",
  },
  {
    id: "events-strip-dinner",
    alt: {
      en: "A long table set with glasses and small posies in a bright room",
      th: "โต๊ะยาวจัดแก้วและช่อดอกไม้เล็ก ๆ ในห้องที่สว่าง",
    },
    h: "ev.space2.h",
    p: "ev.space2.p",
  },
];

/** Seeded events' own photographs, by id · used when the stored value is not one. */
const EVENT_ART: Record<string, ImageId> = {
  "ev-loy-krathong": "events-loy-krathong",
  "ev-songkran-lunch": "events-songkran-lunch",
};

function eventImage(ev: { id: string; image: string }): { id?: ImageId; src?: string } {
  if (ev.image && isImageId(ev.image)) return { id: ev.image };
  const registered = /^\/img\/([a-z0-9-]+)\//.exec(ev.image ?? "")?.[1];
  if (registered && isImageId(registered)) return { id: registered };
  if (ev.image && !ev.image.startsWith("/images/")) return { src: ev.image };
  const art = EVENT_ART[ev.id];
  return art ? { id: art } : {};
}

/**
 * Events and celebrations · a pure server component. The calendar is read
 * from the database (owner-editable); unpublished events never render and
 * past dates drop off. An event shows its own photograph or none: a list row
 * with the date in large type reads as designed either way.
 */
export default async function EventsPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const todayIso = hotelTodayIso();

  const [list, settings, content] = await Promise.all([
    getUpcomingEvents(todayIso),
    getHotelSettingsForPage(),
    getContentMapForPage(locale),
  ]);
  const events = localizeEvents(list, locale, content);
  const heroUpload =
    settings.eventsHeroImage && !settings.eventsHeroImage.startsWith("/images/") ? settings.eventsHeroImage : undefined;

  return (
    <>
      <PageHero
        imageId={heroUpload ? undefined : "hero-events"}
        phoneImageId={heroUpload ? undefined : "hero-events-m"}
        image={heroUpload}
        alt={tr(locale, {
          en: "A white-draped garden pavilion with long reception tables",
          th: "ศาลาในสวนประดับผ้าขาวพร้อมโต๊ะรับรองยาว",
        })}
        eyebrow={t(locale, "nav.events")}
        title={t(locale, "ev.h1")}
        lead={t(locale, "ev.lead")}
        cta={
          <div className="flex flex-wrap gap-3">
            <Link href="/contact?about=event" className="btn-primary">
              {t(locale, "ev.cta")}
            </Link>
            <a href="https://line.me/R/ti/p/@teakhouse" target="_blank" rel="noreferrer" className="btn-secondary">
              {t(locale, "ct.lineBtn")}
            </a>
          </div>
        }
      />

      {/* The spaces */}
      <section className="bg-stone px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-site">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow">{t(locale, "ev.salonEyebrow")}</p>
              <h2 className="mt-4">{t(locale, "ev.salonH2")}</h2>
            </div>
            <div>
              <p className="lead">{t(locale, "ev.salonP")}</p>
              <dl className="mt-8 grid gap-6 border-y border-line py-6 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-sub">{t(locale, "ev.capLabel")}</dt>
                  <dd className="mt-1.5 text-[16px] text-ink">{t(locale, "ev.cap")}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-sub">{t(locale, "ev.typesLabel")}</dt>
                  <dd className="mt-1.5 text-[16px] text-ink">{EVENT_TYPES.map((k) => t(locale, k)).join(" · ")}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-2">
            {SPACES.map((s) => (
              <figure key={s.id}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory">
                  <Picture id={s.id} alt={tr(locale, s.alt)} sizes="(max-width: 767px) calc(100vw - 40px), 600px" fill unveil />
                </div>
                <figcaption className="mt-5">
                  <p className="font-display text-[24px] text-ink">{t(locale, s.h)}</p>
                  <p className="mt-2 text-[15.5px] leading-relaxed text-ink/75">{t(locale, s.p)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* The calendar, from the database */}
      <section className="border-t border-line bg-white px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-site">
          <p className="eyebrow">{t(locale, "ev.listEyebrow")}</p>
          <h2 className="mt-4">{t(locale, "ev.listH2")}</h2>

          {events.length === 0 ? (
            <p className="lead mt-8 max-w-prose">{t(locale, "ev.empty")}</p>
          ) : (
            <div className="mt-12 divide-y divide-line border-y border-line">
              {events.map((ev) => {
                const img = eventImage(ev);
                const when = formatDay(locale, ev.date, { year: true });
                return (
                  <article key={ev.id} className="grid gap-6 py-10 md:grid-cols-[180px_minmax(0,1fr)_280px] md:items-center md:gap-10">
                    <p className="font-display text-[26px] leading-tight text-teak">{when}</p>
                    <div>
                      <h3 className="text-[26px]">{tr(locale, ev.title)}</h3>
                      <p className="mt-3 max-w-[60ch] text-[15.5px] leading-relaxed text-ink/75">{tr(locale, ev.description)}</p>
                      <Link href={`/events/reserve?event=${encodeURIComponent(ev.id)}`} className="link-quiet mt-5">
                        {t(locale, "evr.cta")}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                      </Link>
                    </div>
                    {img.id || img.src ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory">
                        {img.id ? (
                          <Picture id={img.id} alt={tr(locale, ev.title)} sizes="(max-width: 767px) calc(100vw - 40px), 280px" fill unveil />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={img.src} alt={tr(locale, ev.title)} width={640} height={480} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        )}
                      </div>
                    ) : (
                      <div className="hidden md:block" aria-hidden />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
