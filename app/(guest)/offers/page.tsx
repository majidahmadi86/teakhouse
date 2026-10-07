import Link from "next/link";
import { OfferCard } from "@/components/OfferCard";
import { PageHero } from "@/components/PageHero";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { getServerLocale, t, tr } from "@/lib/serverLocale";

const OFFERS = ["1", "2", "3"] as const;

/** Offers · a server page (no dictionary in the browser, no hydration). */
export default function OffersPage() {
  const locale = getServerLocale();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a"
        alt={tr(locale, {
          en: "River view offers",
          th: "ข้อเสนอห้องวิวแม่น้ำ",
        })}
        eyebrow={t(locale, "off.eyebrow")}
        title={t(locale, "off.page")}
        lead={t(locale, "off.lead")}
      />

      <section className="section-pad bg-coral-bg">
        <div className="mx-auto max-w-[1180px]">
          <RevealStagger className="grid gap-7 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <OfferCard n={n} large locale={locale} />
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal className="mt-12 text-center text-sm font-semibold text-sub">
            {t(locale, "off.terms")}
          </Reveal>
          <Reveal className="mt-8 text-center">
            <Link href="/book" className="btn-primary inline-flex">
              {t(locale, "nav.book")}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
