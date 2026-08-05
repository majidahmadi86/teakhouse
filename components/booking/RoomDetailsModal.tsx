"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { AmenityIcon } from "@/components/ui/AmenityIcon";
import {
  AMENITIES,
  type AmenityGroup,
  type AmenityId,
} from "@/lib/amenities";
import { CONDITIONS, CONDITIONS_TITLE } from "@/lib/conditions";
import { useI18n } from "@/lib/i18n";
import type { Room } from "@/lib/rooms";
import { cn } from "@/lib/utils";

const GROUPS: AmenityGroup[] = ["room", "bathroom", "comfort", "services"];

export type RoomDetailsModalProps = {
  room: Room;
  open: boolean;
  onClose: () => void;
};

export function RoomDetailsModal({ room, open, onClose }: RoomDetailsModalProps) {
  const { t, tr, lang } = useI18n();
  const photos = room.photos.slice(0, 6);
  const [activePhoto, setActivePhoto] = useState(0);

  const goPhoto = useCallback(
    (dir: -1 | 1) => {
      setActivePhoto((i) => (i + dir + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    setActivePhoto(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPhoto(-1);
      if (e.key === "ArrowRight") goPhoto(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPhoto]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-details-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[14px] bg-white sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-cloud">
          <SafeImage
            src={photos[activePhoto]}
            alt={tr(room.name)}
            fill
            className="object-cover"
            sizes="(max-width:640px) 100vw, 672px"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink shadow-sm"
            aria-label={t("mobile.close")}
          >
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-sm"
                onClick={() => goPhoto(-1)}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-sm"
                onClick={() => goPhoto(1)}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    className={cn(
                      "h-2 w-2 rounded-full transition",
                      i === activePhoto ? "bg-white" : "bg-white/50"
                    )}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="p-6">
          <h2 id="room-details-title" className="font-display text-2xl text-ink">
            {tr(room.name)}
          </h2>
          <p className="mt-2 text-[0.85rem] font-semibold text-sub">{tr(room.meta)}</p>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/85">
            {tr(room.description)}
          </p>

          <h3 className="mb-4 mt-8 text-lg font-semibold text-ink">{t("rooms.amenities")}</h3>
          <div className="space-y-6">
            {GROUPS.map((group) => {
              const items = room.amenities.filter(
                (id) => AMENITIES[id].group === group
              );
              if (items.length === 0) return null;
              const sectionKey =
                group === "room"
                  ? "sec.room"
                  : group === "bathroom"
                    ? "sec.bathroom"
                    : group === "comfort"
                      ? "sec.comfort"
                      : "sec.services";
              return (
                <div key={group}>
                  <h4 className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
                    {t(sectionKey)}
                  </h4>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {items.map((id) => {
                      const amenity = AMENITIES[id as AmenityId];
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-2.5 rounded-lg bg-cloud px-3 py-2.5"
                        >
                          <AmenityIcon name={amenity.icon} className="h-4 w-4 text-blue" />
                          <span className="text-sm font-semibold text-ink">
                            {lang === "th" ? amenity.th : amenity.en}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl bg-cloud p-5">
            <h3 className="mb-3 text-base font-semibold text-ink">
              {lang === "th" ? CONDITIONS_TITLE.th : CONDITIONS_TITLE.en}
            </h3>
            <ul className="space-y-2">
              {CONDITIONS.map((item) => (
                <li
                  key={item.en}
                  className="flex gap-2 text-sm font-semibold text-ink/85 before:text-blue before:content-['·']"
                >
                  {lang === "th" ? item.th : item.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
