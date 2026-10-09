import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Picture } from "@/components/Picture";
import { ReserveCard } from "@/components/dining/ReserveCard";
import { ChromeMark } from "@/components/site/PageMarks";
import { getHotelSettingsForPage, getPublishedMenu } from "@/lib/cachedData";
import { getContentMapForPage, localizeMenu } from "@/lib/content/localize";
import { dishArt } from "@/lib/dishArt";
import { isImageId, type ImageId } from "@/lib/images";
import { formatServiceWindow } from "@/lib/reservations";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { formatBaht, hotelTodayIso } from "@/lib/utils";
import type { DictEntry } from "@/lib/i18n-dict";

/** ISR · static per language, refreshed hourly and at once on an owner edit
 *  (the menu and settings reads are tag-invalidated, lib/revalidate). */
export const revalidate = 3600;

/** Seeded category art · used when a category carries no uploaded image. */
const CATEGORY_ART: Record<string, { id: ImageId; alt: DictEntry }> = {
  "dc-pier-breakfast": {
    id: "dining-breakfast",
    alt: {
      en: "A white breakfast table with pastries, fruit and fresh juice",
      th: "โต๊ะอาหารเช้าสีขาวกับขนมอบ ผลไม้ และน้ำผลไม้สด",
    },
  },
  "dc-thai-kitchen": {
    id: "dining-thai-kitchen",
    alt: {
      en: "A spread of Thai dishes, curries, salad and rice in white ceramics",
      th: "อาหารไทยหลากจาน แกง ยำ และข้าว ในภาชนะเซรามิกสีขาว",
    },
  },
  "dc-drinks": {
    id: "dining-drinks",
    alt: {
      en: "Two spritz cocktails with herbs and small plates on a pale stone table",
      th: "ค็อกเทลสปริตซ์สองแก้วกับสมุนไพรและจานเล็กบนโต๊ะหินสีอ่อน",
    },
  },
};

/** An owner upload · a seeded path from before v17 (a retired /images/ file) is not one. */
function uploaded(src: string | null | undefined): string | undefined {
  return src && !src.startsWith("/images/") ? src : undefined;
}

/**
 * Dining · a pure server component. The menu and the house settings are two
 * cached, tag-invalidated reads (see lib/cachedData).
 *
 * Images follow the fallback chain: an owner-uploaded URL wins, otherwise the
 * registered photograph of exactly that category or dish, otherwise nothing
 * at all. Reserve-a-table appears as a sticky card beside the menu from lg up
 * and as a sticky bar on small screens, and only while reservations are on.
 */
export default async function DiningPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const [menu, settings, content] = await Promise.all([
    getPublishedMenu(),
    getHotelSettingsForPage(),
    getContentMapForPage(locale),
  ]);
  // The menu in the page language (EntityTranslation rows beyond EN/TH).
  const categories = localizeMenu(menu, locale, content);
  const heroUpload = uploaded(settings.diningHeroImage);

  const reserveCta = settings.reservationsEnabled ? (
    <Link href="/dining/reserve" className="btn-primary">
      {t(locale, "rsv.cta")}
    </Link>
  ) : null;

  return (
    <>
      <PageHero
        imageId={heroUpload ? undefined : "hero-dining"}
        phoneImageId={heroUpload ? undefined : "hero-dining-m"}
        image={heroUpload}
        alt={tr(locale, {
          en: "The River Terrace dining room: wood-panelled walls, white marble and tables set for lunch",
          th: "ห้องอาหารริเวอร์เทอเรซ ผนังไม้ พื้นหินอ่อนสีขาว และโต๊ะที่จัดไว้สำหรับมื้อกลางวัน",
        })}
        eyebrow={t(locale, "nav.dining")}
        title={t(locale, "dn.h1")}
        lead={t(locale, "dn.lead")}
        cta={reserveCta}
      />

      <section className="bg-stone px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-site">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
            <div className="min-w-0 max-w-[820px]">
              <p className="lead max-w-[62ch]">{t(locale, "dn.story")}</p>
              <dl className="mt-8 grid gap-6 border-y border-line py-6 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-sub">
                    {t(locale, "dn.hoursLabel")}
                  </dt>
                  <dd className="mt-1.5 text-[16px] text-ink">{t(locale, "dn.hours")}</dd>
                </div>
                {settings.reservationsEnabled ? (
                  <div>
                    <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-sub">
                      {t(locale, "rsv.cta")}
                    </dt>
                    <dd className="mt-1.5 text-[16px] text-ink">
                      {t(locale, "rsv.window", {
                        w: formatServiceWindow(settings.serviceStart, settings.serviceEnd, locale),
                      })}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-16">
                <p className="eyebrow">{t(locale, "dn.menuEyebrow")}</p>
                <h2 className="mt-4">{t(locale, "dn.menuH2")}</h2>
              </div>

              {categories.map((cat) => {
                const art = CATEGORY_ART[cat.id];
                const upload = uploaded(cat.image);
                return (
                  <section key={cat.id} className="mt-14">
                    {upload || art ? (
                      <div className="relative mb-8 aspect-[16/7] overflow-hidden rounded-card bg-ivory">
                        {upload ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={upload}
                            alt={tr(locale, cat.name)}
                            width={1280}
                            height={560}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Picture
                            id={art.id}
                            alt={tr(locale, art.alt)}
                            sizes="(min-width: 1024px) 820px, calc(100vw - 40px)"
                            fill
                            unveil
                          />
                        )}
                      </div>
                    ) : null}

                    <h3 data-menu-category className="font-display text-[28px] text-ink">
                      {tr(locale, cat.name)}
                    </h3>
                    <ul className="mt-6 divide-y divide-line border-t border-line">
                      {cat.items.map((dish) => {
                        const dArt = dishArt(dish.id);
                        const dUpload = uploaded(dish.image);
                        const artId = dArt && isImageId(dArt.id) ? dArt.id : null;
                        return (
                          <li key={dish.id} className="flex items-start gap-5 py-5">
                            {dUpload || artId ? (
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-soft bg-ivory">
                                {dUpload ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={dUpload}
                                    alt=""
                                    width={128}
                                    height={128}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Picture id={artId!} alt={tr(locale, dArt!.alt)} sizes="64px" maxWidth={256} fill />
                                )}
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-4">
                                <span className="font-display text-[19px] text-ink">{tr(locale, dish.name)}</span>
                                <span className="h-0 flex-1 border-b border-dotted border-line" aria-hidden />
                                <span className="whitespace-nowrap text-[16px] font-medium text-ink">
                                  {formatBaht(dish.price)}
                                </span>
                              </div>
                              <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-ink/70">
                                {tr(locale, dish.description)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>

            {settings.reservationsEnabled ? (
              <ReserveCard
                locale={locale}
                serviceStart={settings.serviceStart}
                serviceEnd={settings.serviceEnd}
                maxPartySize={settings.maxPartySize}
                todayIso={hotelTodayIso()}
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* Reserve · a sticky bar on small screens once the menu has been read.
          Hidden from lg up, where the sticky card carries the same action. */}
      {/* One bar at the foot of a phone: while reservations are on, the
          reserve bar replaces the Book bar instead of stacking under it. */}
      {settings.reservationsEnabled ? <ChromeMark noBookBar /> : null}
      {settings.reservationsEnabled ? (
        <div className="sticky bottom-0 z-sticky border-t border-line bg-white/95 px-4 py-3 shadow-dock backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3">
            <p className="hidden text-[16px] font-medium text-ink md:block">{t(locale, "rsv.stripLead")}</p>
            <Link href="/dining/reserve" className="btn-primary w-full md:w-auto">
              {t(locale, "rsv.cta")}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
