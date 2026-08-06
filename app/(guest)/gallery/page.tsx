"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { Reveal, RevealItem, RevealStagger, ScaleIn } from "@/components/motion/Reveal";
import { unsplashSrc } from "@/lib/unsplashLoader";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Cat = "all" | "rooms" | "pool" | "river" | "food";

const IMAGES: { src: string; cat: Exclude<Cat, "all">; alt: string }[] = [
  { src: unsplashSrc("photo-1631049307264-da0ec9d70304"), cat: "rooms", alt: "River Loft guest room with teak walls" },
  { src: unsplashSrc("photo-1618773928121-c32242e63f39"), cat: "rooms", alt: "Hotel bed dressed in white linen" },
  { src: unsplashSrc("photo-1590490360182-c33d57733427"), cat: "rooms", alt: "Suite seating detail" },
  { src: unsplashSrc("photo-1611892440504-42a792e24d32"), cat: "rooms", alt: "Teak Suite bedroom" },
  { src: unsplashSrc("photo-1578683010236-d716f9a3f461"), cat: "rooms", alt: "Garden Room looking onto greenery" },
  { src: unsplashSrc("photo-1560448204-e02f11c3d0e2"), cat: "rooms", alt: "Courtyard Twin room" },
  { src: unsplashSrc("photo-1584132967334-10e028bd69f7"), cat: "pool", alt: "Courtyard pool at The Teak House" },
  { src: unsplashSrc("photo-1571008887538-b36bb74556e6"), cat: "pool", alt: "Pool deck loungers" },
  { src: unsplashSrc("photo-1544161515-4ab6ce6db874"), cat: "pool", alt: "Spa terrace morning light" },
  { src: unsplashSrc("photo-1552465011-b4e21bf6e79a"), cat: "river", alt: "Long-tail boats on the Chao Phraya" },
  { src: unsplashSrc("photo-1508009603885-50cf7c579365"), cat: "river", alt: "River dusk skyline" },
  { src: unsplashSrc("photo-1582719478250-c89cae4dc85b"), cat: "river", alt: "Riverside balcony view" },
  { src: unsplashSrc("photo-1414235077428-338989a2e8c0"), cat: "food", alt: "Breakfast spread at the house" },
  { src: unsplashSrc("photo-1591087917153-872378c177a2"), cat: "food", alt: "Dining table by the window" },
  { src: unsplashSrc("photo-1600585154340-be6161a56a0c"), cat: "rooms", alt: "Teak house exterior" },
];

const FILTERS: { id: Cat; key: string }[] = [
  { id: "all", key: "gal.all" },
  { id: "rooms", key: "gal.rooms" },
  { id: "pool", key: "gal.pool" },
  { id: "river", key: "gal.river" },
  { id: "food", key: "gal.food" },
];

export default function GalleryPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Cat>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const items = useMemo(
    () =>
      filter === "all" ? IMAGES : IMAGES.filter((img) => img.cat === filter),
    [filter]
  );

  function move(dir: -1 | 1) {
    if (lightbox == null) return;
    setLightbox((lightbox + dir + items.length) % items.length);
  }

  return (
    <>
      <PageHero
        image={unsplashSrc("photo-1631049307264-da0ec9d70304")}
        alt="Gallery of The Teak House interiors"
        eyebrow={t("gal.page")}
        title={t("gal.page")}
        lead={t("gal.lead")}
      />

      <section className="section-pad bg-cloud">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition",
                  filter === f.id
                    ? "bg-blue text-white shadow-cta"
                    : "bg-white text-ink border border-line hover:border-blue"
                )}
              >
                {t(f.key)}
              </button>
            ))}
          </Reveal>

          <RevealStagger stagger={0.06} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {items.map((img, i) => (
              <RevealItem key={img.src + i} className="mb-4 break-inside-avoid">
                <ScaleIn>
                  <button
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="group relative w-full overflow-hidden rounded-card"
                    aria-label={`Open ${img.alt}`}
                  >
                    <SafeImage
                      src={img.src}
                      alt={img.alt}
                      width={480}
                      height={600}
                      quality={70}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                    />
                  </button>
                </ScaleIn>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {lightbox != null ? (
        <div
          className="fixed inset-0 z-modal grid place-items-center bg-navy/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={items[lightbox].alt}
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close gallery"
            onClick={() => setLightbox(null)}
          />
          <div className="relative z-10 w-full max-w-4xl">
            <button
              type="button"
              className="absolute -top-12 right-0 text-white"
              onClick={() => setLightbox(null)}
              aria-label="Close gallery"
            >
              <X className="h-7 w-7" />
            </button>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
              <SafeImage
                src={items[lightbox].src}
                alt={items[lightbox].alt}
                fill
                quality={80}
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => move(-1)}
                className="rounded-full bg-white/10 p-3 text-white"
                aria-label="Previous photo"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="rounded-full bg-white/10 p-3 text-white"
                aria-label="Next photo"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
