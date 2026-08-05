"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { Reveal, RevealItem, RevealStagger, ScaleIn } from "@/components/motion/Reveal";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Cat = "all" | "rooms" | "pool" | "river" | "food";

const IMAGES: { src: string; cat: Exclude<Cat, "all">; alt: string }[] = [
  { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80", cat: "rooms", alt: "Guest room" },
  { src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80", cat: "rooms", alt: "Hotel bed" },
  { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80", cat: "rooms", alt: "Suite detail" },
  { src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80", cat: "rooms", alt: "Teak suite" },
  { src: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80", cat: "rooms", alt: "Garden room" },
  { src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80", cat: "rooms", alt: "Twin room" },
  { src: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80", cat: "pool", alt: "Courtyard pool" },
  { src: "https://images.unsplash.com/photo-1571008887538-b36bb74556e6?w=1200&q=80", alt: "Pool deck", cat: "pool" },
  { src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80", cat: "pool", alt: "Spa terrace" },
  { src: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80", cat: "river", alt: "Long-tail boats" },
  { src: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80", cat: "river", alt: "River dusk" },
  { src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80", cat: "river", alt: "Riverside view" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80", cat: "food", alt: "Breakfast" },
  { src: "https://images.unsplash.com/photo-1591087917153-872378c177a2?w=1200&q=80", cat: "food", alt: "Dining" },
  { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80", cat: "rooms", alt: "House exterior" },
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
        image="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1900&q=80"
        alt="Gallery"
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
                  >
                    <SafeImage
                      src={img.src}
                      alt={img.alt}
                      width={800}
                      height={1000}
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
        <div className="fixed inset-0 z-modal grid place-items-center bg-navy/85 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          />
          <div className="relative z-10 w-full max-w-4xl">
            <button
              type="button"
              className="absolute -top-12 right-0 text-white"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <X className="h-7 w-7" />
            </button>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
              <SafeImage
                src={items[lightbox].src}
                alt={items[lightbox].alt}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => move(-1)}
                className="rounded-full bg-white/10 p-3 text-white"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="rounded-full bg-white/10 p-3 text-white"
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
