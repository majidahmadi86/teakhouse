import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Picture } from "@/components/Picture";
import type { ImageId } from "@/lib/images";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { cn } from "@/lib/utils";
import type { OfferId } from "@/lib/offers";

const OFFERS: { n: "1" | "2" | "3"; id: OfferId; image?: ImageId; alt?: { en: string; th: string } }[] = [
  // Early bird · no photograph says "booked early"; its panel is the numeral.
  { n: "1", id: "early" },
  {
    n: "2",
    id: "longer",
    image: "offers-stay-longer",
    alt: {
      en: "A timber dining table with woven chairs beneath a tall window full of green",
      th: "โต๊ะอาหารไม้กับเก้าอี้สานใต้หน้าต่างบานสูงที่เต็มไปด้วยสีเขียว",
    },
  },
  {
    n: "3",
    id: "arrival",
    image: "offers-airport-pickup",
    alt: {
      en: "The open rear door of the hotel car, cream leather seats inside",
      th: "ประตูหลังของรถโรงแรมเปิดอยู่ เห็นเบาะหนังสีครีมด้านใน",
    },
  },
];

/**
 * Offers · server HTML. Each offer is a row: its photograph where one shows
 * exactly that offer, otherwise a calm panel with the offer's numeral, the
 * same size and place, so the page reads as one design.
 */
export default function OffersPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);

  return (
    <>
      <PageHero eyebrow={t(locale, "off.eyebrow")} title={t(locale, "off.page")} lead={t(locale, "off.lead")} />

      <section className="bg-stone px-5 pb-20 sm:px-8 md:pb-28">
        <div className="mx-auto max-w-site space-y-16 md:space-y-24">
          {OFFERS.map((o, i) => (
            <article key={o.n} id={`offer-${o.n}`} className="grid scroll-mt-28 items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-card", i % 2 === 1 && "md:order-2", o.image ? "bg-ivory" : "bg-ivory")}>
                {o.image ? (
                  <Picture id={o.image} alt={o.alt ? tr(locale, o.alt) : ""} sizes="(max-width: 767px) calc(100vw - 40px), 600px" fill unveil />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center border border-line/80 text-center">
                    <span className="rule" aria-hidden />
                    <p className="mt-8 font-display text-[clamp(5rem,12vw,9rem)] leading-none text-teak">{t(locale, `off.${o.n}.numeral`)}</p>
                    <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-sub">{t(locale, `off.${o.n}.badge`)}</p>
                  </div>
                )}
              </div>
              <div className="max-w-[520px]">
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-teak">{t(locale, `off.${o.n}.badge`)}</p>
                <h2 className="mt-3 text-[clamp(1.8rem,2.8vw,2.4rem)]">{t(locale, `off.${o.n}.title`)}</h2>
                <p className="lead mt-5">{t(locale, `off.${o.n}.body`)}</p>
                {/* v18 · the offer travels to /book, which applies its rule to the quote. */}
                <Link href={`/book?offer=${o.id}`} prefetch={false} className="btn-primary mt-8">
                  {t(locale, "off.cta")}
                </Link>
              </div>
            </article>
          ))}
          <p className="border-t border-line pt-8 text-center text-[14px] text-sub">{t(locale, "off.terms")}</p>
        </div>
      </section>
    </>
  );
}
