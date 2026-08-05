"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { AmenityIcon } from "@/components/ui/AmenityIcon";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ListboxField } from "@/components/ui/ListboxField";
import { PriceChip } from "@/components/PriceChip";
import {
  AMENITIES,
  type AmenityGroup,
  type AmenityId,
} from "@/lib/amenities";
import { CONDITIONS, CONDITIONS_TITLE } from "@/lib/conditions";
import { useI18n } from "@/lib/i18n";
import type { Room } from "@/lib/rooms";
import { useGuestRooms } from "@/lib/ownerStore";
import {
  addDays,
  formatBaht,
  isoDate,
  nightsBetween,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

const GROUPS: AmenityGroup[] = ["room", "bathroom", "comfort", "services"];

type RoomDetailClientProps = {
  room: Room;
};

export function RoomDetailClient({ room }: RoomDetailClientProps) {
  const { t, tr, lang } = useI18n();
  const allRooms = useGuestRooms();
  const otherRooms = allRooms.filter((r) => r.slug !== room.slug);

  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(() => addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(() => addDays(new Date(), 2));
  const [guests, setGuests] = useState("2");

  const photos = room.photos.slice(0, 6);
  const nights = nightsBetween(isoDate(checkIn), isoDate(checkOut));
  const total = room.rate * nights;
  const save = (room.ota - room.rate) * nights;

  const guestOptions = ["1", "2", "3", "4"].map((n) => ({
    value: n,
    label: t(`g${n}` as "g1"),
  }));

  const goPhoto = useCallback(
    (dir: -1 | 1) => {
      setActivePhoto((i) => (i + dir + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goPhoto(-1);
      if (e.key === "ArrowRight") goPhoto(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goPhoto]);

  const bookHref = `/book?room=${room.shortKey}&in=${isoDate(checkIn)}&out=${isoDate(checkOut)}&g=${guests}`;

  const bookingRail = (
    <div className="rounded-[14px] bg-white p-6 shadow-panel">
      <div className="space-y-4">
        <DateRangePicker
          from={checkIn}
          to={checkOut}
          onChange={(from, to) => {
            if (from) setCheckIn(from);
            if (to) setCheckOut(to);
          }}
          placeholder={t("avail.selectDates")}
          numberOfMonths={1}
        />
        <ListboxField
          label={t("avail.guests")}
          value={guests}
          onChange={setGuests}
          options={guestOptions}
        />
      </div>
      <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <span>
            {formatBaht(room.rate)} x {nights} {nights > 1 ? t("bk.nights") : t("bk.night")}
          </span>
          <span className="font-semibold">{formatBaht(total)}</span>
        </div>
        <div className="flex justify-between text-deal">
          <span>{t("bk.save")}</span>
          <span className="font-bold">-{formatBaht(save)}</span>
        </div>
      </div>
      <Link
        href={bookHref}
        className="mt-5 flex w-full items-center justify-center rounded-full bg-blue py-3.5 text-sm font-bold text-white transition hover:bg-blue-dark"
      >
        {t("rooms.bookThis")}
      </Link>
    </div>
  );

  return (
    <>
      <section className="px-6 pb-8 pt-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
            <button
              type="button"
              className="relative aspect-[16/10] overflow-hidden rounded-[14px]"
              onClick={() => setLightboxOpen(true)}
            >
              <SafeImage
                src={photos[activePhoto]}
                alt={tr(room.name)}
                fill
                className="object-cover"
                priority
              />
            </button>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-1 lg:grid-rows-5">
              {photos.slice(0, 5).map((photo, i) => (
                <button
                  key={photo}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden rounded-lg lg:aspect-auto lg:min-h-0 lg:flex-1",
                    activePhoto === i && "ring-2 ring-sky"
                  )}
                >
                  <SafeImage src={photo} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              <h1 className="text-4xl">{tr(room.name)}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {[room.meta, room.floor].map((chip) => (
                  <span
                    key={chip.en}
                    className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink/80"
                  >
                    {tr(chip)}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <PriceChip rate={room.rate} ota={room.ota} showSave />
              </div>
              <p className="mt-6 max-w-prose text-[1.05rem] leading-relaxed text-ink/85">
                {tr(room.description)}
              </p>

              <div className="mt-12">
                <h2 className="mb-6 text-2xl">{t("rooms.amenities")}</h2>
                <div className="space-y-8">
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
                        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-amber">
                          {t(sectionKey)}
                        </h3>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {items.map((id) => {
                            const amenity = AMENITIES[id as AmenityId];
                            return (
                              <li
                                key={id}
                                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
                              >
                                <AmenityIcon name={amenity.icon} className="text-blue" />
                                <span className="text-sm font-semibold">
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
              </div>

              <div className="mt-12 rounded-[14px] bg-white p-6 shadow-panel">
                <h2 className="mb-4 text-xl">
                  {lang === "th" ? CONDITIONS_TITLE.th : CONDITIONS_TITLE.en}
                </h2>
                <ul className="space-y-2">
                  {CONDITIONS.map((item) => (
                    <li
                      key={item.en}
                      className="flex gap-2 text-sm font-semibold text-ink/85 before:text-amber before:content-['·']"
                    >
                      {lang === "th" ? item.th : item.en}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="hidden lg:sticky lg:top-24 lg:block">{bookingRail}</div>
          </div>
        </div>
      </section>

      <div className="z-bar fixed inset-x-0 bottom-0 border-t border-line bg-white/95 p-4 pb-safe backdrop-blur-md lg:hidden">
        {bookingRail}
      </div>

      <section className="bg-surface px-6 py-24 pb-40 lg:pb-24">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-8">{t("rooms.other")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherRooms.map((other) => (
              <Link
                key={other.id}
                href={`/rooms/${other.slug}`}
                className="group overflow-hidden rounded-[14px] bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3]">
                  <SafeImage
                    src={other.photos[0]}
                    alt={tr(other.name)}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg">{tr(other.name)}</h3>
                  <p className="text-sm font-semibold text-strike">{tr(other.meta)}</p>
                  <p className="mt-1 font-display text-xl">{formatBaht(other.rate)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={(e) => {
            const touch = e.changedTouches[0];
            (e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX);
          }}
          onTouchEnd={(e) => {
            const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            if (Math.abs(diff) > 50) goPhoto(diff > 0 ? -1 : 1);
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setLightboxOpen(false)}
            aria-label={t("mobile.close")}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              goPhoto(-1);
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <div className="relative h-[70vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <SafeImage
              src={photos[activePhoto]}
              alt={tr(room.name)}
              fill
              className="object-contain"
            />
          </div>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              goPhoto(1);
            }}
            aria-label="Next"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      ) : null}
    </>
  );
}
