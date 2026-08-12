import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { prisma } from "@/lib/db";
import { diningCategoryToClient } from "@/lib/dining";
import { getPageMedia, getReservationSettings } from "@/lib/hotelSettings";
import { formatServiceWindow } from "@/lib/reservations";
import { getServerLocale, t, tr } from "@/lib/serverLocale";
import { formatBaht } from "@/lib/utils";

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
 * Dining · a pure server component like /facilities. The menu is read from the
 * database (owner-editable in the Dining manager); unpublished categories and
 * dishes never render. Everything is static HTML at first paint · zero client
 * JS, readable with JS disabled.
 *
 * Images follow the v13 fallback chain: an owner-uploaded URL wins, otherwise
 * the seeded local AVIF. The reserve-a-table calls to action appear only while
 * reservations are switched on in the owner panel.
 */
export default async function DiningPage() {
  const locale = getServerLocale();
  const [categories, media, reservations] = await Promise.all([
    prisma.diningCategory
      .findMany({
        where: { published: true },
        orderBy: { order: "asc" },
        include: {
          items: { where: { published: true }, orderBy: { order: "asc" } },
        },
      })
      .then((rows) =>
        rows.map(diningCategoryToClient).filter((c) => c.items.length > 0)
      ),
    getPageMedia(),
    getReservationSettings(),
  ]);

  const reserveCta = reservations.reservationsEnabled ? (
    <Link href="/dining/reserve" className="btn-primary inline-flex">
      {t(locale, "rsv.cta")}
    </Link>
  ) : null;

  return (
    <>
      <PageHero
        image={media.diningHeroImage || "/images/dining/hero-1280.webp"}
        imageAvif={media.diningHeroImage ? undefined : "/images/dining/hero-1280.avif"}
        imageWebp={media.diningHeroImage ? undefined : "/images/dining/hero-1280.webp"}
        unoptimized={Boolean(media.diningHeroImage)}
        alt="Thai dishes served on a dark table, close crop"
        eyebrow={t(locale, "nav.dining")}
        title={t(locale, "dn.h1")}
        lead={t(locale, "dn.lead")}
        cta={reserveCta}
      />

      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[820px]">
          <p className="max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
            {t(locale, "dn.story")}
          </p>
          <p className="mt-6 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center rounded-full bg-sky px-4 py-2.5 text-[0.85rem] font-bold text-blue">
              {t(locale, "dn.hours")}
            </span>
            {reservations.reservationsEnabled ? (
              <span className="inline-flex items-center rounded-full bg-cloud px-4 py-2.5 text-[0.85rem] font-bold text-ink/80">
                {t(locale, "rsv.window", {
                  w: formatServiceWindow(
                    reservations.serviceStart,
                    reservations.serviceEnd
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

                <h3 className="font-display text-2xl text-ink">
                  {tr(locale, cat.name)}
                </h3>
                <ul className="mt-6 space-y-6">
                  {cat.items.map((dish) => (
                    <li key={dish.id} className="flex gap-4">
                      {dish.image ? (
                        <div className="relative hidden h-[72px] w-[96px] shrink-0 overflow-hidden rounded-lg sm:block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={dish.image}
                            alt={tr(locale, dish.name)}
                            width={192}
                            height={144}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
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
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      {/* Reserve · a sticky bar on small screens once the menu has been read,
          static from md up. It sits below the concierge FAB's own offset, so
          the two never overlap. */}
      {reservations.reservationsEnabled ? (
        <div className="sticky bottom-0 z-sticky border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] md:static md:border-0 md:bg-transparent md:px-6 md:py-10 md:backdrop-blur-none">
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
