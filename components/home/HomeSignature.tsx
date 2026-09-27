import Link from "next/link";
import { addonToClient } from "@/lib/addons";
import { getPublicRates } from "@/lib/cachedData";
import { formatThb, translate as t, translateEntry as tr, type Lang } from "@/lib/translate";

/**
 * v15 · "Bespoke" · the signature packages on the home page, editorial.
 *
 * Server component reading the tag-cached catalogue (one cached read, no
 * client JS). Four packages, each a photograph with a small-capitals category,
 * the name in Cormorant and a price in gold. Heights are reserved so the
 * section never shifts. Falls back to nothing if the catalogue is empty.
 */
export async function HomeSignature({ locale }: { locale: Lang }) {
  let addons: ReturnType<typeof addonToClient>[] = [];
  try {
    const { addons: rows } = await getPublicRates();
    addons = rows.map(addonToClient).filter((a) => a.image).slice(0, 4);
  } catch {
    return null;
  }
  if (addons.length === 0) return null;

  return (
    <section className="tkh-below-section section-pad bg-white" data-signature>
      <div className="mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="eyebrow mb-4">{t(locale, "sig.eyebrow")}</p>
          <h2>{t(locale, "sig.h2")}</h2>
          <span className="luxe-rule luxe-rule--center mt-6" aria-hidden />
          <p className="mx-auto mt-6 max-w-prose text-[1.05rem] leading-relaxed text-ink/80">{t(locale, "sig.p")}</p>
        </div>
        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {addons.map((a) => (
            <li key={a.key} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.image}
                  alt={tr(locale, a.name)}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.04]"
                />
              </div>
              <p className="luxe-caps mt-5 text-gold">{t(locale, `ow.pkg.cat.${a.category}`)}</p>
              <h3 className="mt-2 font-display text-[1.45rem] leading-tight text-ink">{tr(locale, a.name)}</h3>
              <p className="mt-2 min-h-[3.4rem] text-[0.86rem] leading-relaxed text-sub">{tr(locale, a.description)}</p>
              <p className="mt-3 font-display text-lg text-ink">
                {formatThb(a.price)}{" "}
                <span className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-sub">
                  {t(locale, `bk.pkg.unit.${a.unit}`)}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-14 text-center">
          <Link href="/book" prefetch={false} className="btn-primary">
            {t(locale, "sig.cta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
