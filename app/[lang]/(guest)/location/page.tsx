import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { RiverMap } from "@/components/site/RiverMap";
import { t } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";

const DIRECTIONS = [
  { title: "lc.1h", body: "lc.1p" },
  { title: "lc.2h", body: "lc.2p" },
  { title: "lc.3h", body: "lc.3p" },
  { title: "lc.4h", body: "lc.4p" },
] as const;

const MAP_ROUTE = "https://maps.google.com/?q=Charoenkrung+44+Bang+Rak+Bangkok";

/**
 * Location · server HTML. No photograph of the neighbourhood passed the art
 * direction (the candidates showed the wrong city), so the page opens with
 * words and a drawn map of the hotel's stretch of the river; directions are
 * written out, and the route opens in the guest's own maps app.
 */
export default function LocationPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);

  return (
    <>
      <PageHero eyebrow={t(locale, "nav.location")} title={t(locale, "lc.h1")} lead={t(locale, "lc.lead")} />

      <section className="bg-stone px-5 pb-20 sm:px-8 md:pb-28">
        <div className="tkh-reveal-stagger mx-auto grid max-w-site gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
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
            <p className="mt-5 text-[15px] text-ink/75">{t(locale, "ct.address")}</p>
            <a href={MAP_ROUTE} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6">
              {t(locale, "lc.route")}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <div>
            <p className="eyebrow">{t(locale, "lc.dir")}</p>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {DIRECTIONS.map(({ title, body }) => (
                <article key={title} className="py-6">
                  <h2 className="text-[24px]">{t(locale, title)}</h2>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink/80">{t(locale, body)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
