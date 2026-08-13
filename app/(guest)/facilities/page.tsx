import Link from "next/link";
import { LocalPicture } from "@/components/LocalPicture";
import { PageHero } from "@/components/PageHero";
import { FACILITIES } from "@/lib/facilities";
import { getServerLocale, t, tr } from "@/lib/serverLocale";

/**
 * Facilities · a pure server component. Every card is static HTML at first
 * paint: real text, real image, no hydration, no reveal that could leave it
 * blank. The photography is local AVIF (WebP fallback) at two widths.
 */
export default function FacilitiesPage() {
  const locale = getServerLocale();

  return (
    <>
      <PageHero
        image="/images/facilities/lobby-lounge-1280.webp"
        imageAvif="/images/facilities/lobby-lounge-1280.avif"
        imageWebp="/images/facilities/lobby-lounge-1280.webp"
        alt={tr(locale, {
          en: "Teak lobby lounge with armchairs",
          th: "เลานจ์ไม้สักพร้อมเก้าอี้นวม",
        })}
        eyebrow={t(locale, "nav.facilities")}
        title={t(locale, "fac.h1")}
        lead={t(locale, "fac.lead")}
      />

      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FACILITIES.map((facility) => (
              <article
                key={facility.key}
                className="overflow-hidden rounded-[14px] bg-white shadow-card transition hover:shadow-card-hover"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <LocalPicture
                    base={facility.base}
                    alt={tr(locale, facility.alt)}
                    width={640}
                    height={480}
                    sizes="(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 380px"
                  />
                </div>
                <div className="p-6">
                  <h2 className="font-display text-xl text-ink">
                    {t(locale, `${facility.key}.h`)}
                  </h2>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">
                    {t(locale, `${facility.key}.p`)}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/70">
                    {t(locale, `${facility.key}.p2`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
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
