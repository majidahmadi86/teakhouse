import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ConciergeAskButton } from "@/components/ConciergeAskButton";
import { HouseAndTeam } from "@/components/HouseAndTeam";
import { PageHero } from "@/components/PageHero";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { cn } from "@/lib/utils";
import type { DictEntry } from "@/lib/i18n-dict";

const SECTIONS: {
  image: string;
  alt: DictEntry;
  title: string;
  p1: string;
  p2: string;
}[] = [
  {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    alt: { en: "Breakfast table", th: "โต๊ะอาหารเช้า" },
    title: "xp.1h",
    p1: "xp.1p",
    p2: "xp.1p2",
  },
  {
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
    alt: { en: "Courtyard pool", th: "สระว่ายน้ำในคอร์ตยาร์ด" },
    title: "xp.2h",
    p1: "xp.2p",
    p2: "xp.2p2",
  },
  {
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
    alt: { en: "Thai massage", th: "นวดแผนไทย" },
    title: "xp.3h",
    p1: "xp.3p",
    p2: "xp.3p2",
  },
  {
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a",
    alt: { en: "Evening on the Chao Phraya", th: "ค่ำคืนริมแม่น้ำเจ้าพระยา" },
    title: "xp.4h",
    p1: "xp.4p",
    p2: "xp.4p2",
  },
];

const NEIGHBORHOOD = ["xp.n1", "xp.n2", "xp.n3", "xp.n4"] as const;

/**
 * Experience · a server page. The story rows used to be a client component
 * driven by framer-motion (slide-ins and a scroll parallax); they are now
 * static HTML with transform-only CSS motion (app/globals.css: tkh-reveal,
 * tkh-parallax), so the page ships no animation library and reads the same
 * with scripting off. The only island is the "ask the concierge" button.
 */
export default function ExperiencePage({ params }: { params: LangParams }) {
  const locale = pageLang(params);

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a"
        alt={tr(locale, {
          en: "Long-tail boat on the river",
          th: "เรือหางยาวในแม่น้ำ",
        })}
        eyebrow={t(locale, "nav.experience")}
        title={t(locale, "xp.h1")}
        lead={t(locale, "xp.lead")}
      />

      {/* overflow-x-clip · the reveal motion starts each block offset, and must
          never widen the document. */}
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
                <Reveal>
                  <div className="relative overflow-hidden rounded-[14px] shadow-panel">
                    <div className="tkh-parallax relative aspect-[4/3] w-full">
                      <Image
                        src={section.image}
                        alt={tr(locale, section.alt)}
                        fill
                        sizes="(max-width: 1024px) 100vw, 566px"
                        className="scale-110 object-cover"
                      />
                    </div>
                  </div>
                </Reveal>
                <Reveal>
                  <h2 className="text-3xl">{t(locale, section.title)}</h2>
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/85">
                    {t(locale, section.p1)}
                  </p>
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/80">
                    {t(locale, section.p2)}
                  </p>
                  <ConciergeAskButton
                    topic={t(locale, section.title)}
                    className="group mt-8 inline-flex items-center gap-2 rounded-full border border-blue px-6 py-3 text-sm font-bold text-blue transition hover:bg-sky"
                  >
                    {t(locale, "xp.ask")}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                  </ConciergeAskButton>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-pad overflow-x-clip bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <h2 className="mb-8">{t(locale, "xp.nbh")}</h2>
          </Reveal>
          <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NEIGHBORHOOD.map((key) => (
              <RevealItem key={key}>
                <article className="rounded-[14px] bg-white p-6 shadow-card">
                  <h3 className="font-display text-xl">{t(locale, key)}</h3>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <HouseAndTeam locale={locale} />

      <section className="bg-cloud px-6 py-16 text-center">
        <h2>{t(locale, "cta.h2")}</h2>
        <p className="mx-auto mt-4 max-w-prose text-[1.08rem] text-ink/80">
          {t(locale, "cta.p")}
        </p>
        <Link href="/book" className="btn-primary mt-8 inline-flex">
          {t(locale, "xp.cta")}
        </Link>
      </section>
    </>
  );
}
