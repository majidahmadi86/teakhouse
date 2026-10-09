import { PageHero } from "@/components/PageHero";
import { Picture } from "@/components/Picture";
import { FACILITIES } from "@/lib/facilities";
import { isImageId } from "@/lib/images";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { cn } from "@/lib/utils";

/**
 * Facilities · a pure server component. The facilities with a photograph of
 * exactly that place are features, image and words side by side; the
 * services that have none (the river pier, luggage) are set in words below,
 * in the same calm type, never with a stand-in photograph.
 */
export default function FacilitiesPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const pictured = FACILITIES.filter((f) => f.image && isImageId(f.image));
  const words = FACILITIES.filter((f) => !f.image || !isImageId(f.image));

  return (
    <>
      <PageHero eyebrow={t(locale, "nav.facilities")} title={t(locale, "fac.h1")} lead={t(locale, "fac.lead")} />

      <section className="bg-stone px-5 pb-20 sm:px-8 md:pb-28">
        <div className="mx-auto max-w-site space-y-20 md:space-y-28">
          {pictured.map((f, i) => (
            <article key={f.key} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-card bg-ivory", i % 2 === 1 && "md:order-2")}>
                <Picture
                  id={f.image as never}
                  alt={f.alt ? tr(locale, f.alt) : ""}
                  sizes="(max-width: 767px) calc(100vw - 40px), 600px"
                  fill
                  unveil
                  priority={i === 0}
                />
              </div>
              <div className="max-w-[520px]">
                <p className="font-display text-[15px] text-teak">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 text-[clamp(1.8rem,2.8vw,2.4rem)]">{t(locale, `${f.key}.h`)}</h2>
                <p className="lead mt-5">{t(locale, `${f.key}.p`)}</p>
                <p className="mt-3 text-[16px] leading-relaxed text-ink/70">{t(locale, `${f.key}.p2`)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-ivory px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto max-w-site">
          <p className="eyebrow">{t(locale, "fac.alsoEyebrow")}</p>
          <h2 className="mt-4">{t(locale, "fac.alsoH2")}</h2>
          <div className="mt-10 grid gap-x-12 border-t border-line sm:grid-cols-2">
            {words.map((f) => (
              <article key={f.key} className="border-b border-line py-8">
                <h3 className="text-[24px]">{t(locale, `${f.key}.h`)}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink/80">{t(locale, `${f.key}.p`)}</p>
                <p className="mt-2 text-[15.5px] leading-relaxed text-ink/65">{t(locale, `${f.key}.p2`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
