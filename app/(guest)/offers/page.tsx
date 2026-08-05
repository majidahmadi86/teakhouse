"use client";

import Link from "next/link";
import { OfferCard } from "@/components/OfferCard";
import { PageHero } from "@/components/PageHero";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { useI18n } from "@/lib/i18n";

const OFFERS = ["1", "2", "3"] as const;

export default function OffersPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1900&q=85"
        alt="River view offers"
        eyebrow={t("off.eyebrow")}
        title={t("off.page")}
        lead={t("off.lead")}
      />

      <section className="section-pad bg-coral-bg">
        <div className="mx-auto max-w-[1180px]">
          <RevealStagger className="grid gap-7 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <OfferCard n={n} large />
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal className="mt-12 text-center text-sm font-semibold text-sub">
            {t("off.terms")}
          </Reveal>
          <Reveal className="mt-8 text-center">
            <Link href="/book" className="btn-primary inline-flex">
              {t("nav.book")}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
