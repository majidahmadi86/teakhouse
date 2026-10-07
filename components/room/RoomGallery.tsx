"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

/**
 * A room's photos · the main image, five thumbnails and a lightbox. An island
 * (a "sheet" in A1's terms) on an otherwise server-rendered room page: the
 * strings arrive translated as props, so it carries no dictionary.
 */
export function RoomGallery({
  photos,
  name,
  photoLabels,
  closeLabel,
  prevLabel,
  nextLabel,
}: {
  photos: string[];
  name: string;
  /** One accessible label per thumbnail, already in the page language. */
  photoLabels: string[];
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const go = useCallback(
    (dir: -1 | 1) => setActive((i) => (i + dir + photos.length) % photos.length),
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  return (
    <>
      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_120px]">
        <button
          type="button"
          className="relative aspect-[16/10] overflow-hidden rounded-[14px]"
          onClick={() => setOpen(true)}
        >
          <SafeImage
            src={photos[active]}
            alt={name}
            fill
            className="object-cover"
            priority
            quality={78}
            sizes="(max-width: 1024px) 100vw, 960px"
          />
        </button>
        <div className="grid grid-cols-5 gap-2 lg:grid-cols-1 lg:grid-rows-5">
          {photos.slice(0, 5).map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActive(i)}
              aria-label={photoLabels[i]}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg lg:aspect-auto lg:min-h-0 lg:flex-1",
                active === i && "ring-2 ring-sky"
              )}
            >
              <SafeImage src={photo} alt="" fill quality={65} sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-navy/90"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          onTouchStart={(e) => {
            const touch = e.changedTouches[0];
            (e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX);
          }}
          onTouchEnd={(e) => {
            const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 50) go(diff > 0 ? -1 : 1);
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label={prevLabel}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <div className="relative h-[70vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <SafeImage
              src={photos[active]}
              alt={name}
              fill
              quality={80}
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-contain"
            />
          </div>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label={nextLabel}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      ) : null}
    </>
  );
}
