import { Picture } from "@/components/Picture";
import type { ImageId } from "@/lib/images";
import { translate as t, translateEntry as tr, type Lang } from "@/lib/translate";

/**
 * House and team · server-rendered, no client JS.
 *
 * The house in its own photograph, the four roles as words, and three
 * photographs of the work itself (the concierge's bell, folded towels, the
 * kitchen's knife on a mango) rather than portraits: a demo site should not
 * attach an invented name to an identifiable stranger.
 */
const ROLES = ["house.r1", "house.r2", "house.r3", "house.r4"] as const;

const WORK: { id: ImageId; alt: { en: string; th: string } }[] = [
  { id: "exp-team-concierge", alt: { en: "A brass service bell on a white-linen table", th: "กระดิ่งบริการทองเหลืองบนโต๊ะผ้าลินินสีขาว" } },
  { id: "exp-team-housekeeping", alt: { en: "Two white towels folded into bows on a freshly made bed", th: "ผ้าเช็ดตัวสีขาวสองผืนพับเป็นโบว์บนเตียงที่เพิ่งจัด" } },
  { id: "exp-team-kitchen", alt: { en: "A cook's hands slicing ripe mango", th: "มือของพ่อครัวกำลังหั่นมะม่วงสุก" } },
];

export function HouseAndTeam({ locale }: { locale: Lang }) {
  return (
    <section id="house" className="scroll-mt-28 border-t border-line bg-white px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-site">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-ivory">
            <Picture
              id="exp-house"
              alt={tr(locale, {
                en: "The hotel: white louvred balconies and glass above a garden pool",
                th: "ตัวโรงแรม ระเบียงบานเกล็ดสีขาวและกระจกเหนือสระว่ายน้ำในสวน",
              })}
              sizes="(max-width: 1023px) calc(100vw - 40px), 480px"
              fill
              unveil
            />
          </div>

          <div>
            <p className="eyebrow">{t(locale, "house.eyebrow")}</p>
            <h2 className="mt-4">{t(locale, "house.h2")}</h2>
            <p className="lead mt-6">{t(locale, "house.p1")}</p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/75">{t(locale, "house.p2")}</p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/75">{t(locale, "house.p3")}</p>
          </div>
        </div>

        <div className="mt-24 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h3 className="text-[clamp(1.6rem,2.4vw,2.1rem)]">{t(locale, "house.teamH")}</h3>
            <p className="mt-4 max-w-prose text-[16px] leading-relaxed text-ink/75">{t(locale, "house.teamP")}</p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {ROLES.map((key) => (
                <li key={key} className="py-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-teak">{t(locale, `${key}r`)}</p>
                  <p className="mt-1.5 font-display text-[20px] text-ink">{t(locale, `${key}n`)}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(locale, `${key}p`)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] text-sub">{t(locale, "house.demoNote")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {WORK.map((w, i) => (
              <div
                key={w.id}
                className={i === 0 ? "relative col-span-2 aspect-[16/10] overflow-hidden rounded-card bg-ivory" : "relative aspect-square overflow-hidden rounded-card bg-ivory"}
              >
                <Picture id={w.id} alt={tr(locale, w.alt)} sizes="(max-width: 1023px) 50vw, 300px" fill unveil />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
