import { ArrowRight } from "lucide-react";
import { ConciergeAskButton } from "@/components/ConciergeAskButton";
import { HouseAndTeam } from "@/components/HouseAndTeam";
import { Picture } from "@/components/Picture";
import { Reveal } from "@/components/motion/Reveal";
import type { ImageId } from "@/lib/images";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import { cn } from "@/lib/utils";
import type { DictEntry } from "@/lib/i18n-dict";

const SECTIONS: { image?: ImageId; alt?: DictEntry; title: string; p1: string; p2: string }[] = [
  {
    image: "exp-breakfast",
    alt: { en: "Sliced watermelon, berries and pastries on a white breakfast table", th: "แตงโมหั่น เบอร์รี และขนมอบบนโต๊ะอาหารเช้าสีขาว" },
    title: "xp.1h",
    p1: "xp.1p",
    p2: "xp.1p2",
  },
  {
    image: "exp-pool",
    alt: { en: "Sunlit stone steps leading into clear pool water", th: "ขั้นบันไดหินต้องแสงแดดลงสู่สระน้ำใส" },
    title: "xp.2h",
    p1: "xp.2p",
    p2: "xp.2p2",
  },
  {
    image: "exp-massage",
    alt: { en: "A therapist's hands at work on a white-towelled massage table", th: "มือของนักบำบัดบนเตียงนวดปูผ้าขาว" },
    title: "xp.3h",
    p1: "xp.3p",
    p2: "xp.3p2",
  },
  // Evening on the river · no photograph passed; set in words.
  { title: "xp.4h", p1: "xp.4p", p2: "xp.4p2" },
];

const NEIGHBORHOOD = ["xp.n1", "xp.n2", "xp.n3", "xp.n4"] as const;

/**
 * Experience · a server page with transform-only CSS motion. It opens with
 * the house itself (the double-height lobby), then the day at the hotel in
 * the hotel's own photographs, the neighbourhood, and the house and its team.
 * The only island is the "ask the concierge" button.
 */
export default function ExperiencePage({ params }: { params: LangParams }) {
  const locale = pageLang(params);

  return (
    <>
      <section className="bg-stone">
        <div className="wrap grid items-center gap-10 pb-16 pt-12 md:grid-cols-[1fr_1.05fr] md:gap-16 md:pb-24 md:pt-20">
          <div>
            <p className="eyebrow">{t(locale, "nav.experience")}</p>
            <h1 className="mt-4 md:mt-5">{t(locale, "xp.h1")}</h1>
            <p className="lead mt-6 max-w-[56ch]">{t(locale, "xp.lead")}</p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-ivory md:aspect-[4/5]">
            <Picture
              id="exp-about-house"
              alt={tr(locale, {
                en: "The double-height lobby: a timber staircase, tall white columns and tropical planting",
                th: "ล็อบบี้เพดานสูงสองชั้น บันไดไม้ เสาสีขาวสูง และพรรณไม้เขตร้อน",
              })}
              sizes="(max-width: 767px) calc(100vw - 40px), 50vw"
              priority
              fill
            />
          </div>
        </div>
      </section>

      <section className="overflow-x-clip border-t border-line bg-white px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-site space-y-20 md:space-y-28">
          {SECTIONS.map((section, index) =>
            section.image ? (
              <div
                key={section.title}
                className={cn("grid items-center gap-10 md:grid-cols-2 md:gap-16", index % 2 === 1 && "md:[&>*:first-child]:order-2")}
              >
                <Reveal>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory">
                    <Picture
                      id={section.image}
                      alt={section.alt ? tr(locale, section.alt) : ""}
                      sizes="(max-width: 767px) calc(100vw - 40px), 600px"
                      fill
                      unveil
                    />
                  </div>
                </Reveal>
                <Reveal>
                  <p className="font-display text-[15px] text-teak">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-3 text-[clamp(1.8rem,2.8vw,2.4rem)]">{t(locale, section.title)}</h2>
                  <p className="lead mt-5">{t(locale, section.p1)}</p>
                  <p className="mt-3 text-[16px] leading-relaxed text-ink/70">{t(locale, section.p2)}</p>
                  <ConciergeAskButton topic={t(locale, section.title)} className="link-quiet group mt-8">
                    {t(locale, "xp.ask")}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180" aria-hidden />
                  </ConciergeAskButton>
                </Reveal>
              </div>
            ) : (
              <Reveal key={section.title} className="mx-auto max-w-[760px] border-y border-line py-14 text-center">
                <p className="font-display text-[15px] text-teak">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 text-[clamp(1.8rem,2.8vw,2.4rem)]">{t(locale, section.title)}</h2>
                <p className="lead mx-auto mt-5 max-w-[58ch]">{t(locale, section.p1)}</p>
                <p className="mx-auto mt-3 max-w-[58ch] text-[16px] leading-relaxed text-ink/70">{t(locale, section.p2)}</p>
                <ConciergeAskButton topic={t(locale, section.title)} className="link-quiet group mt-8">
                  {t(locale, "xp.ask")}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180" aria-hidden />
                </ConciergeAskButton>
              </Reveal>
            )
          )}
        </div>
      </section>

      <section className="border-t border-line bg-ivory px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto max-w-site">
          <p className="eyebrow">{t(locale, "xp.nbhEyebrow")}</p>
          <h2 className="mt-4">{t(locale, "xp.nbh")}</h2>
          <ol className="mt-10 grid border-t border-line sm:grid-cols-2 sm:gap-x-12">
            {NEIGHBORHOOD.map((key, i) => (
              <li key={key} className="flex gap-5 border-b border-line py-6">
                <span className="font-display text-[15px] text-teak">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-[21px] text-ink">{t(locale, key)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <HouseAndTeam locale={locale} />
    </>
  );
}
