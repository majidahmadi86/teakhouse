"use client";

import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { MotionCard, Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
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

      <section className="section-pad bg-white">
        <div className="mx-auto max-w-[1180px]">
          <RevealStagger className="grid gap-7 md:grid-cols-3">
            {OFFERS.map((n) => (
              <RevealItem key={n}>
                <MotionCard className="tkh-card flex h-full flex-col p-7">
                  <span className="urgency-chip w-fit">{t(`off.${n}.badge`)}</span>
                  <h2 className="mt-5 font-display text-[1.6rem] text-ink">
                    {t(`off.${n}.title`)}
                  </h2>
                  <p className="mt-3 flex-1 text-[0.98rem] leading-relaxed text-sub">
                    {t(`off.${n}.body`)}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-strike">
                    {t("off.terms")}
                  </p>
                  <Link href="/book" className="btn-primary mt-6 w-full">
                    {t("off.cta")}
                  </Link>
                </MotionCard>
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal className="mt-12 text-center text-sm font-semibold text-sub">
            {t("off.terms")}
          </Reveal>
        </div>
      </section>
    </>
  );
}
