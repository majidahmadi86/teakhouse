import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { prisma } from "@/lib/db";
import { diningCategoryToClient } from "@/lib/dining";
import { getServerLocale, t, tr } from "@/lib/serverLocale";
import { formatBaht } from "@/lib/utils";

export const revalidate = 0;

/**
 * Dining · a pure server component like /facilities. The menu is read from the
 * database (owner-editable in the Dining manager); unpublished categories and
 * dishes never render. Everything is static HTML at first paint · zero client
 * JS, readable with JS disabled.
 */
export default async function DiningPage() {
  const locale = getServerLocale();

  const categories = (
    await prisma.diningCategory.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        items: { where: { published: true }, orderBy: { order: "asc" } },
      },
    })
  )
    .map(diningCategoryToClient)
    .filter((c) => c.items.length > 0);

  return (
    <>
      <PageHero
        image="/images/facilities/pier-breakfast-1280.webp"
        imageAvif="/images/facilities/pier-breakfast-1280.avif"
        imageWebp="/images/facilities/pier-breakfast-1280.webp"
        alt="Breakfast tables on the river pier"
        eyebrow={t(locale, "nav.dining")}
        title={t(locale, "dn.h1")}
        lead={t(locale, "dn.lead")}
      />

      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[820px]">
          <p className="max-w-prose text-[1.08rem] leading-relaxed text-ink/80">
            {t(locale, "dn.story")}
          </p>
          <p className="mt-6">
            <span className="inline-flex items-center rounded-full bg-sky px-4 py-2.5 text-[0.85rem] font-bold text-blue">
              {t(locale, "dn.hours")}
            </span>
          </p>

          <div className="mt-14">
            <p className="eyebrow mb-3.5">{t(locale, "dn.menuEyebrow")}</p>
            <h2>{t(locale, "dn.menuH2")}</h2>
          </div>

          {categories.map((cat) => (
            <section key={cat.id} className="mt-12">
              <h3 className="font-display text-2xl text-ink">
                {tr(locale, cat.name)}
              </h3>
              <ul className="mt-6 space-y-6">
                {cat.items.map((dish) => (
                  <li key={dish.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[1.02rem] font-bold text-ink">
                        {tr(locale, dish.name)}
                      </span>
                      <span className="h-0 flex-1 border-b border-dotted border-line" aria-hidden />
                      <span className="whitespace-nowrap text-[1.02rem] font-bold text-blue">
                        {formatBaht(dish.price)}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-[58ch] text-[0.92rem] leading-relaxed text-ink/75">
                      {tr(locale, dish.description)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

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
