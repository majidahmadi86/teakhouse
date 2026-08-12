import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ReserveCard } from "@/components/dining/ReserveCard";
import { getHotelSettings, getPublishedMenu } from "@/lib/cachedData";
import { dishArt } from "@/lib/dishArt";
import { formatServiceWindow } from "@/lib/reservations";
import { getServerLocale, t, tr } from "@/lib/serverLocale";
import { formatBaht, isoDate } from "@/lib/utils";

export const revalidate = 0;

/** Seeded category art · used when a category carries no uploaded image. */
const CATEGORY_ART: Record<string, { base: string; alt: string }> = {
  "dc-pier-breakfast": {
    base: "/images/dining/breakfast",
    alt: "Thai rice soup and breakfast dishes on a wooden table",
  },
  "dc-thai-kitchen": {
    base: "/images/dining/thai-kitchen",
    alt: "Thai curry and rice served in earthenware bowls",
  },
  "dc-drinks": {
    base: "/images/dining/drinks",
    alt: "Cocktails with lime and mint on a bar counter",
  },
};

/**
 * Dining · a pure server component. The menu and the house settings are two
 * cached, tag-invalidated reads (see lib/cachedData), so the page no longer
 * pays a database round trip per request · that was most of its 1.7s TTFB.
 *
 * Images follow the fallback chain: an owner-uploaded URL wins, otherwise the
 * seeded local AVIF, otherwise nothing at all. Reserve-a-table appears as a
 * sticky card beside the menu from lg up and as a sticky bar on small screens,
 * and only while reservations are switched on.
 */
export default async function DiningPage() {
  const locale = getServerLocale();
  const [categories, settings] = await Promise.all([
    getPublishedMenu(),
    getHotelSettings(),
  ]);

  const reserveCta = settings.reservationsEnabled ? (
    <Link href="/dining/reserve" className="btn-primary inline-flex">
      {t(locale, "rsv.cta")}
    </Link>
  ) : null;

  return (
    <>
      <PageHero
        image={settings.diningHeroImage || "/images/dining/hero-1280.webp"}
        imageAvif={settings.diningHeroImage ? undefined : "/images/dining/hero-1280.avif"}
        imageWebp={settings.diningHeroImage ? undefined : "/images/dining/hero-1280.webp"}
        unoptimized={Boolean(settings.diningHeroImage)}
        alt="Thai dishes served on a dark table, close crop"
        eyebrow={t(locale, "nav.dining")}
        title={t(locale, "dn.h1")}
        lead={t(locale, "dn.lead")}
        cta={reserveCta}
      />

      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
            <div className="min-w-0 max-w-[820px]">
              <p className="max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
                {t(locale, "dn.story")}
              </p>
              <p className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center rounded-full bg-sky px-4 py-2.5 text-[0.85rem] font-bold text-blue">
                  {t(locale, "dn.hours")}
                </span>
                {settings.reservationsEnabled ? (
                  <span className="inline-flex items-center rounded-full bg-cloud px-4 py-2.5 text-[0.85rem] font-bold text-ink/80">
                    {t(locale, "rsv.window", {
                      w: formatServiceWindow(
                        settings.serviceStart,
                        settings.serviceEnd
                      ),
                    })}
                  </span>
                ) : null}
              </p>

              <div className="mt-14">
                <p className="eyebrow mb-3.5">{t(locale, "dn.menuEyebrow")}</p>
                <h2>{t(locale, "dn.menuH2")}</h2>
              </div>

              {categories.map((cat) => {
                const art = CATEGORY_ART[cat.id];
                return (
                  <section key={cat.id} className="mt-12">
                    {cat.image || art ? (
                      <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-[14px] shadow-card">
                        {cat.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={cat.image}
                            alt={tr(locale, cat.name)}
                            width={1280}
                            height={560}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <picture>
                            <source srcSet={`${art.base}-1280.avif`} type="image/avif" />
                            <source srcSet={`${art.base}-1280.webp`} type="image/webp" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${art.base}-1280.webp`}
                              alt={art.alt}
                              width={1280}
                              height={560}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          </picture>
                        )}
                      </div>
                    ) : null}

                    <h3
                      data-menu-category
                      className="font-display text-2xl text-ink"
                    >
                      {tr(locale, cat.name)}
                    </h3>
                    <ul className="mt-6 space-y-5">
                      {cat.items.map((dish) => {
                        const art = dishArt(dish.id);
                        const thumb = dish.image || art;
                        return (
                          <li key={dish.id} className="flex items-start gap-4">
                            {thumb ? (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cloud shadow-[0_2px_10px_rgba(16,24,40,.10)]">
                                {dish.image ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={dish.image}
                                    alt=""
                                    width={128}
                                    height={128}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <picture>
                                    <source srcSet={`${art.base}-256.avif`} type="image/avif" />
                                    <source srcSet={`${art.base}-256.webp`} type="image/webp" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`${art.base}-256.webp`}
                                      alt=""
                                      width={128}
                                      height={128}
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover"
                                    />
                                  </picture>
                                )}
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-4">
                                <span className="text-[1.02rem] font-bold text-ink">
                                  {tr(locale, dish.name)}
                                </span>
                                <span
                                  className="h-0 flex-1 border-b border-dotted border-line"
                                  aria-hidden
                                />
                                <span className="whitespace-nowrap text-[1.02rem] font-bold text-blue">
                                  {formatBaht(dish.price)}
                                </span>
                              </div>
                              <p className="mt-1.5 max-w-[58ch] text-[0.92rem] leading-relaxed text-ink/75">
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
                todayIso={isoDate(new Date())}
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* Reserve · a sticky bar on small screens once the menu has been read.
          Hidden from lg up, where the sticky card carries the same action. */}
      {settings.reservationsEnabled ? (
        <div className="sticky bottom-0 z-sticky border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3">
            <p className="hidden text-[1.02rem] font-semibold text-ink md:block">
              {t(locale, "rsv.stripLead")}
            </p>
            <Link
              href="/dining/reserve"
              className="btn-primary w-full justify-center md:w-auto"
            >
              {t(locale, "rsv.cta")}
            </Link>
          </div>
        </div>
      ) : null}

      <section className="bg-cloud px-6 py-16 text-center">
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
