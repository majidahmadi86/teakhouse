import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Picture } from "@/components/Picture";
import type { ImageId } from "@/lib/images";
import { t, tr } from "@/lib/serverLocale";
import { pageLang, type LangParams } from "@/lib/pageLocale";
import type { DictEntry } from "@/lib/i18n-dict";

type Cat = "all" | "spaces" | "pool" | "food";

/** Twelve frames, each shown once on the whole site (zero reuse). */
const IMAGES: { id: ImageId; cat: Exclude<Cat, "all">; tall?: boolean; alt: DictEntry }[] = [
  { id: "gallery-teak-corridor", cat: "spaces", alt: { en: "A curving pale stone walkway along a balcony toward tropical green", th: "ทางเดินหินสีอ่อนโค้งไปตามระเบียงสู่แมกไม้เขตร้อน" } },
  { id: "gallery-pool-cabana", cat: "pool", alt: { en: "White-draped timber cabanas beside a turquoise pool", th: "ศาลาไม้ประดับผ้าขาวข้างสระสีฟ้าคราม" } },
  { id: "gallery-tea-set", cat: "food", tall: true, alt: { en: "A glass teapot and cup of chrysanthemum tea", th: "กาน้ำชาแก้วและถ้วยชาเก๊กฮวย" } },
  { id: "gallery-orchid-console", cat: "spaces", tall: true, alt: { en: "White orchids against a pale wall", th: "กล้วยไม้สีขาวกับผนังสีอ่อน" } },
  { id: "gallery-river-rail-cocktails", cat: "food", alt: { en: "Two cocktails at the terrace rail over the water", th: "ค็อกเทลสองแก้วที่ราวระเบียงเหนือผืนน้ำ" } },
  { id: "gallery-lotus-basin", cat: "pool", alt: { en: "A pink water lily above floating pads", th: "บัวสีชมพูเหนือใบบัวลอยน้ำ" } },
  { id: "gallery-window-seat", cat: "spaces", alt: { en: "Tea and an open book on a bright window seat", th: "ชาและหนังสือที่เปิดค้างบนที่นั่งริมหน้าต่างอันสว่าง" } },
  { id: "gallery-chef-hands", cat: "food", tall: true, alt: { en: "A cook dressing a plated dish", th: "พ่อครัวกำลังแต่งจานอาหาร" } },
  { id: "gallery-spa-still-life", cat: "pool", alt: { en: "Rolled cream woven towels at the spa", th: "ผ้าขนหนูสีครีมม้วนเรียงที่สปา" } },
  { id: "gallery-palm-shadows", cat: "spaces", tall: true, alt: { en: "Palm fronds and their shadows on a warm plaster wall", th: "ใบปาล์มและเงาบนผนังปูนโทนอุ่น" } },
  { id: "gallery-fruit-basket", cat: "food", alt: { en: "A woven basket of tropical fruit", th: "ตะกร้าสานใส่ผลไม้เขตร้อน" } },
  { id: "gallery-wardrobe-robes", cat: "spaces", alt: { en: "Two white bathrobes hanging beyond a doorway", th: "เสื้อคลุมอาบน้ำสีขาวสองตัวแขวนอยู่หลังประตู" } },
];

const FILTERS: { id: Cat; key: string }[] = [
  { id: "all", key: "gal.all" },
  { id: "spaces", key: "gal.spaces" },
  { id: "pool", key: "gal.pool" },
  { id: "food", key: "gal.food" },
];

/**
 * Gallery · a server page with no JavaScript of its own. The filters are
 * radio buttons that CSS reads with :has(); each photograph opens its own
 * :target lightbox (back closes it, HeaderSync closes it on Escape), whose
 * larger image is lazy and loads only when opened.
 */
export default function GalleryPage({ params }: { params: LangParams }) {
  const locale = pageLang(params);
  const n = IMAGES.length;

  return (
    <>
      <PageHero
        imageId="hero-gallery"
        phoneImageId="hero-gallery-m"
        alt={tr(locale, {
          en: "A pale wood staircase rising through a bright stone atrium",
          th: "บันไดไม้สีอ่อนทอดขึ้นในโถงหินอันสว่าง",
        })}
        eyebrow={t(locale, "gal.page")}
        title={t(locale, "gal.h1")}
        lead={t(locale, "gal.lead")}
      />

      <section className="tkh-gallery bg-stone px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-site">
          <div className="mb-10 flex flex-wrap gap-2" role="radiogroup" aria-label={t(locale, "gal.page")}>
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
                  className="cursor-pointer rounded-soft border border-line bg-white px-4 py-2 text-[14.5px] font-medium text-ink/80 transition hover:border-ink/30 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest"
                >
                  {t(locale, f.key)}
                </label>
              </span>
            ))}
          </div>

          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {IMAGES.map((img, i) => (
              <div key={img.id} data-cat={img.cat} className="mb-4 break-inside-avoid">
                <a
                  href={`#photo-${i + 1}`}
                  className="group relative block overflow-hidden rounded-card bg-ivory"
                  aria-label={tr(locale, img.alt)}
                >
                  <div className={img.tall ? "relative aspect-[4/5]" : "relative aspect-[4/3]"}>
                    <Picture
                      id={img.id}
                      alt={tr(locale, img.alt)}
                      sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 400px"
                      fill
                      unveil
                      className="transition duration-700 ease-calm group-hover:scale-[1.03]"
                    />
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {IMAGES.map((img, i) => {
        const prev = ((i - 1 + n) % n) + 1;
        const next = ((i + 1) % n) + 1;
        return (
          <div
            key={img.id}
            id={`photo-${i + 1}`}
            className="tkh-lightbox fixed inset-0 z-modal hidden place-items-center bg-stone/95 p-4 target:grid"
            role="dialog"
            aria-modal="true"
            aria-label={tr(locale, img.alt)}
          >
            <a href="#gallery-closed" className="absolute inset-0" aria-label={t(locale, "a11y.closeGallery")} />
            <div className="relative z-10 w-full max-w-5xl">
              <a href="#gallery-closed" className="absolute -top-12 end-0 text-ink" aria-label={t(locale, "a11y.closeGallery")}>
                <X className="h-7 w-7" aria-hidden />
              </a>
              <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ivory">
                <Picture id={img.id} alt={tr(locale, img.alt)} sizes="(max-width: 1023px) 100vw, 1024px" fill className="!object-contain" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <a href={`#photo-${prev}`} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink" aria-label={t(locale, "a11y.prevPhoto")}>
                  <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
                </a>
                <p className="text-center text-[14.5px] text-ink/75">{tr(locale, img.alt)}</p>
                <a href={`#photo-${next}`} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink" aria-label={t(locale, "a11y.nextPhoto")}>
                  <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
