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
import type { DictEntry } from "@/lib/i18n-dict";

const SECTIONS = [
  {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    alt: { en: "Breakfast table", th: "โต๊ะอาหารเช้า" },
    title: "xp.1h",
    p1: "xp.1p",
    p2: "xp.1p2",
    topicKey: "xp.1h",
  },
  {
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
    alt: { en: "Courtyard pool", th: "สระว่ายน้ำในคอร์ตยาร์ด" },
    title: "xp.2h",
    p1: "xp.2p",
    p2: "xp.2p2",
    topicKey: "xp.2h",
  },
  {
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
    alt: { en: "Thai massage", th: "นวดแผนไทย" },
    title: "xp.3h",
    p1: "xp.3p",
    p2: "xp.3p2",
    topicKey: "xp.3h",
  },
  {
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a",
    alt: { en: "Evening on the Chao Phraya", th: "ค่ำคืนริมแม่น้ำเจ้าพระยา" },
    title: "xp.4h",
    p1: "xp.4p",
    p2: "xp.4p2",
    topicKey: "xp.4h",
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

export default function ExperienceClient() {
  const { t, tr } = useI18n();
  const reduce = useReducedMotion();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a"
        alt={tr({
          en: "Long-tail boat on the river",
          th: "เรือหางยาวในแม่น้ำ",
        })}
        eyebrow={t("nav.experience")}
        title={t("xp.h1")}
        lead={t("xp.lead")}
      />

      {/* overflow-x-clip · the reveal animations below start each block
          translated 40-48px sideways, which extended the document and made
          the page scroll horizontally at 360-1093 until they animated in.
          Present in English too · this is a layout fix, not a Thai one. */}
      <section className="section-pad overflow-x-clip bg-white">
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
                  alt={tr(section.alt)}
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
                    topic={t(section.topicKey)}
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

      <section className="section-pad overflow-x-clip bg-cloud">
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

    </>
  );
}
