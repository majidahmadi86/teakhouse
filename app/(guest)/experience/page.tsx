"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { ConciergeAskButton } from "@/components/ConciergeFab";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    alt: "Breakfast table",
    title: "xp.1h",
    p1: "xp.1p",
    p2: "xp.1p2",
    topic: "Breakfast on the pier",
  },
  {
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
    alt: "Courtyard pool",
    title: "xp.2h",
    p1: "xp.2p",
    p2: "xp.2p2",
    topic: "The courtyard pool",
  },
  {
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
    alt: "Thai massage",
    title: "xp.3h",
    p1: "xp.3p",
    p2: "xp.3p2",
    topic: "Thai massage upstairs",
  },
  {
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a",
    alt: "Evening on the Chao Phraya",
    title: "xp.4h",
    p1: "xp.4p",
    p2: "xp.4p2",
    topic: "Evening long-tail ride",
  },
] as const;

const NEIGHBORHOOD = ["xp.n1", "xp.n2", "xp.n3", "xp.n4"] as const;

function ParallaxImage({
  src,
  alt,
  fromLeft,
}: {
  src: string;
  alt: string;
  fromLeft: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-6%", "6%"]
  );

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden rounded-[14px] shadow-panel"
      initial={reduce ? false : { opacity: 0, x: fromLeft ? -48 : 48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div style={{ y }} className="relative aspect-[4/3] w-full">
        <SafeImage src={src} alt={alt} fill className="object-cover scale-110" />
      </motion.div>
    </motion.div>
  );
}

export default function ExperiencePage() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a"
        alt="Long-tail boat on the river"
        eyebrow={t("nav.experience")}
        title={t("xp.h1")}
        lead={t("xp.lead")}
      />

      <section className="section-pad bg-white">
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
                <ParallaxImage
                  src={section.image}
                  alt={section.alt}
                  fromLeft={!reversed}
                />
                <motion.div
                  initial={reduce ? false : { opacity: 0, x: reversed ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-3xl">{t(section.title)}</h2>
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/85">
                    {t(section.p1)}
                  </p>
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/80">
                    {t(section.p2)}
                  </p>
                  <ConciergeAskButton
                    topic={section.topic}
                    className="group mt-8 inline-flex items-center gap-2 rounded-full border border-blue px-6 py-3 text-sm font-bold text-blue transition hover:bg-sky"
                  >
                    {t("xp.ask")}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </ConciergeAskButton>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <h2 className="mb-8">{t("xp.nbh")}</h2>
          </Reveal>
          <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NEIGHBORHOOD.map((key) => (
              <RevealItem key={key}>
                <article className="rounded-[14px] bg-white p-6 shadow-card">
                  <h3 className="font-display text-xl">{t(key)}</h3>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <Reveal>
          <h2>{t("cta.h2")}</h2>
          <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
            {t("cta.p")}
          </p>
          <Link href="/book" className="btn-primary mt-8 inline-flex">
            {t("xp.cta")}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
