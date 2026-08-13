import { LocalPicture } from "@/components/LocalPicture";
import {
  translate as t,
  translateEntry as tr,
  type Lang,
} from "@/lib/translate";

/**
 * House & team · server-rendered, no client JS.
 *
 * The team is presented as roles with demo names against environmental
 * photography (a desk, a bell, a trolley, hands at work) rather than portraits.
 * A demo site should not attach an invented name and job title to an
 * identifiable stranger; a real property swaps these for its own staff photos.
 */
const ROLES = [
  { base: "/images/house/front-desk", key: "house.r1", alt: { en: "The front desk of the house", th: "เคาน์เตอร์ต้อนรับของที่พัก" } },
  { base: "/images/house/concierge-desk", key: "house.r2", alt: { en: "Brass service bell on the concierge desk", th: "กระดิ่งทองเหลืองบนเคาน์เตอร์ผู้ช่วย" } },
  { base: "/images/house/housekeeping-team", key: "house.r3", alt: { en: "Housekeeping trolley in the upstairs corridor", th: "รถเข็นทำความสะอาดในทางเดินชั้นบน" } },
  { base: "/images/house/kitchen", key: "house.r4", alt: { en: "Fruit being prepared for breakfast", th: "การเตรียมผลไม้สำหรับอาหารเช้า" } },
] as const;

export function HouseAndTeam({ locale }: { locale: Lang }) {
  return (
    <section id="house" className="section-pad scroll-mt-24 bg-white">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[14px] shadow-panel">
            <div className="relative aspect-[4/5]">
              <LocalPicture
                base="/images/house/story"
                alt={tr(locale, {
                  en: "The teak house seen from the river",
                  th: "บ้านไม้สักมองจากริมแม่น้ำ",
                })}
                width={640}
                height={800}
                sizes="(max-width: 1024px) 100vw, 460px"
              />
            </div>
          </div>

          <div>
            <p className="eyebrow mb-3.5">{t(locale, "house.eyebrow")}</p>
            <h2>{t(locale, "house.h2")}</h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink/85">
              {t(locale, "house.p1")}
            </p>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/80">
              {t(locale, "house.p2")}
            </p>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/80">
              {t(locale, "house.p3")}
            </p>
          </div>
        </div>

        <div className="mt-20">
          <h3 className="font-display text-2xl text-ink">
            {t(locale, "house.teamH")}
          </h3>
          <p className="mt-3 max-w-prose text-[1.02rem] leading-relaxed text-ink/80">
            {t(locale, "house.teamP")}
          </p>

          <ul className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <li
                key={role.key}
                className="overflow-hidden rounded-[14px] bg-cloud shadow-card"
              >
                <div className="relative aspect-square overflow-hidden">
                  <LocalPicture
                    base={role.base}
                    alt={tr(locale, role.alt)}
                    width={640}
                    height={640}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 270px"
                  />
                </div>
                <div className="p-5">
                  <p className="font-display text-lg text-ink">
                    {t(locale, `${role.key}n`)}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-blue">
                    {t(locale, `${role.key}r`)}
                  </p>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-ink/75">
                    {t(locale, `${role.key}p`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[0.8rem] font-semibold text-sub">
            {t(locale, "house.demoNote")}
          </p>
        </div>
      </div>
    </section>
  );
}
