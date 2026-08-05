"use client";

import Link from "next/link";
import { ConciergeAskButton } from "@/components/Concierge";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    alt: "Breakfast table",
    title: "xp.1h",
    p1: "xp.1p",
    p2: "xp.1p2",
    topic: "Breakfast on the pier",
  },
  {
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80",
    alt: "Courtyard pool",
    title: "xp.2h",
    p1: "xp.2p",
    p2: "xp.2p2",
    topic: "The courtyard pool",
  },
  {
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80",
    alt: "Thai massage",
    title: "xp.3h",
    p1: "xp.3p",
    p2: "xp.3p2",
    topic: "Thai massage upstairs",
  },
  {
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80",
    alt: "Evening on the Chao Phraya",
    title: "xp.4h",
    p1: "xp.4p",
    p2: "xp.4p2",
    topic: "Evening long-tail ride",
  },
] as const;

const NEIGHBORHOOD = ["xp.n1", "xp.n2", "xp.n3", "xp.n4"] as const;

export default function ExperiencePage() {
  const { t } = useI18n();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1528181304800-259b08848526?w=1900&q=80"
        alt="Long-tail boat on the river"
        eyebrow={t("nav.experience")}
        title={t("xp.h1")}
        lead={t("xp.lead")}
      />

      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1180px] space-y-24">
          {SECTIONS.map((section, index) => {
            const reversed = index % 2 === 1;
            return (
              <div
                key={section.title}
                className={cn(
                  "grid items-center gap-12 lg:grid-cols-2",
                  reversed && "lg:[&>*:first-child]:order-2"
                )}
              >
                <div className="relative overflow-hidden rounded-[14px] shadow-panel">
                  <SafeImage
                    src={section.image}
                    alt={section.alt}
                    width={1200}
                    height={900}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-3xl">{t(section.title)}</h2>
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/85">
                    {t(section.p1)}
                  </p>
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/80">
                    {t(section.p2)}
                  </p>
                  <ConciergeAskButton
                    topic={section.topic}
                    className="mt-8 inline-flex rounded-full border border-brand/30 px-6 py-3 text-sm font-bold text-brand transition hover:bg-deal-bg"
                  >
                    {t("xp.ask")}
                  </ConciergeAskButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-surface px-6 py-16">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-8">{t("xp.nbh")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NEIGHBORHOOD.map((key) => (
              <article
                key={key}
                className="rounded-[14px] bg-white p-6 shadow-[0_8px_30px_rgba(23,33,29,0.07)]"
              >
                <h3 className="font-display text-xl">{t(key)}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-[1180px]">
          <h2>{t("cta.h2")}</h2>
          <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
            {t("cta.p")}
          </p>
          <Link
            href="/book"
            className="mt-8 inline-flex rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-white"
          >
            {t("xp.cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
