import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Reveal, RevealStagger, ScaleIn } from "@/components/motion/Reveal";
import { unsplashSrc } from "@/lib/unsplashLoader";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import type { DictEntry } from "@/lib/i18n-dict";

type Cat = "all" | "rooms" | "pool" | "river" | "food";

const IMAGES: { src: string; cat: Exclude<Cat, "all">; alt: DictEntry }[] = [
  { src: unsplashSrc("photo-1631049307264-da0ec9d70304"), cat: "rooms", alt: { en: "River Loft guest room with teak walls", th: "ห้อง River Loft ผนังไม้สัก" } },
  { src: unsplashSrc("photo-1618773928121-c32242e63f39"), cat: "rooms", alt: { en: "Hotel bed dressed in white linen", th: "เตียงปูผ้าสีขาว" } },
  { src: unsplashSrc("photo-1590490360182-c33d57733427"), cat: "rooms", alt: { en: "Suite seating detail", th: "มุมนั่งเล่นในห้องสวีท" } },
  { src: unsplashSrc("photo-1611892440504-42a792e24d32"), cat: "rooms", alt: { en: "Teak Suite bedroom", th: "ห้องนอนของ Teak Suite" } },
  { src: unsplashSrc("photo-1578683010236-d716f9a3f461"), cat: "rooms", alt: { en: "Garden Room looking onto greenery", th: "ห้อง Garden Room มองเห็นสวนเขียว" } },
  { src: unsplashSrc("photo-1560448204-e02f11c3d0e2"), cat: "rooms", alt: { en: "Courtyard Twin room", th: "ห้อง Courtyard Twin" } },
  { src: unsplashSrc("photo-1584132967334-10e028bd69f7"), cat: "pool", alt: { en: "Courtyard pool at The Teak House", th: "สระว่ายน้ำในคอร์ตยาร์ดของ The Teak House" } },
  { src: unsplashSrc("photo-1544161515-4ab6ce6db874"), cat: "pool", alt: { en: "Spa terrace morning light", th: "แสงเช้าที่ระเบียงสปา" } },
  { src: unsplashSrc("photo-1552465011-b4e21bf6e79a"), cat: "river", alt: { en: "Long-tail boats on the Chao Phraya", th: "เรือหางยาวในแม่น้ำเจ้าพระยา" } },
  { src: unsplashSrc("photo-1508009603885-50cf7c579365"), cat: "river", alt: { en: "River dusk skyline", th: "เส้นขอบฟ้าริมแม่น้ำตอนพลบค่ำ" } },
  { src: unsplashSrc("photo-1582719478250-c89cae4dc85b"), cat: "river", alt: { en: "Riverside balcony view", th: "วิวจากระเบียงริมแม่น้ำ" } },
  { src: unsplashSrc("photo-1414235077428-338989a2e8c0"), cat: "food", alt: { en: "Breakfast spread at the house", th: "สำรับอาหารเช้าของที่พัก" } },
  { src: unsplashSrc("photo-1600585154340-be6161a56a0c"), cat: "rooms", alt: { en: "Teak house exterior", th: "ตัวอาคารบ้านไม้สัก" } },
];

const FILTERS: { id: Cat; key: string }[] = [
  { id: "all", key: "gal.all" },
  { id: "rooms", key: "gal.rooms" },
  { id: "pool", key: "gal.pool" },
  { id: "river", key: "gal.river" },
  { id: "food", key: "gal.food" },
];

/**
 * Gallery · a server page with no JavaScript of its own.
 *
 * The filters are radio buttons: CSS (app/globals.css, "Gallery") hides the
 * photos of the other categories with :has(), so they work with scripting off
 * and cost nothing to hydrate. Each photo links to its own lightbox, which
 * opens through :target (back closes it, and HeaderSync closes it on Escape);
 * the lightbox image is lazy, so it downloads only when opened.
 */
export default function GalleryPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const n = IMAGES.length;

  return (
    <>
      <PageHero
        image={unsplashSrc("photo-1631049307264-da0ec9d70304")}
        alt={tr(locale, {
          en: "Gallery of The Teak House interiors",
          th: "ภาพภายในของ The Teak House",
        })}
        eyebrow={t(locale, "gal.page")}
        title={t(locale, "gal.page")}
        lead={t(locale, "gal.lead")}
      />

      <section className="tkh-gallery section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <span key={f.id} className="relative inline-flex">
                <input
                  type="radio"
                  name="gallery-filter"
                  id={`gal-${f.id}`}
                  defaultChecked={f.id === "all"}
                  className="peer sr-only"
                />
                <label
                  htmlFor={`gal-${f.id}`}
                  className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-blue peer-checked:border-blue peer-checked:bg-blue peer-checked:text-white peer-checked:shadow-cta peer-focus-visible:ring-2 peer-focus-visible:ring-sky"
                >
                  {t(locale, f.key)}
                </label>
              </span>
            ))}
          </Reveal>

          <RevealStagger stagger={0.06} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {IMAGES.map((img, i) => (
              <div key={img.src} data-cat={img.cat} className="mb-4 break-inside-avoid">
                  <ScaleIn>
                    <a
                      href={`#photo-${i + 1}`}
                      className="group relative block w-full overflow-hidden rounded-card"
                      aria-label={tr(locale, img.alt)}
                    >
                      <Image
                        src={img.src}
                        alt={tr(locale, img.alt)}
                        width={480}
                        height={600}
                        quality={70}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                      />
                    </a>
                  </ScaleIn>
              </div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {IMAGES.map((img, i) => {
        const prev = ((i - 1 + n) % n) + 1;
        const next = ((i + 1) % n) + 1;
        return (
          <div
            key={img.src}
            id={`photo-${i + 1}`}
            className="tkh-lightbox fixed inset-0 z-modal hidden place-items-center bg-navy/85 p-4 target:grid"
            role="dialog"
            aria-modal="true"
            aria-label={tr(locale, img.alt)}
          >
            <a href="#gallery-closed" className="absolute inset-0" aria-label={t(locale, "a11y.closeGallery")} />
            <div className="relative z-10 w-full max-w-4xl">
              <a
                href="#gallery-closed"
                className="absolute -top-12 right-0 text-white"
                aria-label={t(locale, "a11y.closeGallery")}
              >
                <X className="h-7 w-7" aria-hidden />
              </a>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
                <Image
                  src={img.src}
                  alt={tr(locale, img.alt)}
                  fill
                  quality={80}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-contain"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <a
                  href={`#photo-${prev}`}
                  className="rounded-full bg-white/10 p-3 text-white"
                  aria-label={t(locale, "a11y.prevPhoto")}
                >
                  <ChevronLeft aria-hidden />
                </a>
                <a
                  href={`#photo-${next}`}
                  className="rounded-full bg-white/10 p-3 text-white"
                  aria-label={t(locale, "a11y.nextPhoto")}
                >
                  <ChevronRight aria-hidden />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
