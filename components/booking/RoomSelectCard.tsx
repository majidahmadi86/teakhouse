"use client";

import { Check } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { AmenityIcon } from "@/components/ui/AmenityIcon";
import { AMENITIES, type AmenityId } from "@/lib/amenities";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import type { Room, RoomShortKey } from "@/lib/rooms";
import { cn } from "@/lib/utils";

const URGENCY: Partial<Record<RoomShortKey, string>> = {
  loft: "urg.loft",
  garden: "urg.garden",
};

export type RoomSelectCardProps = {
  room: Room;
  selected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  /** Sum of the nightly rates for the chosen dates · null before dates exist. */
  stayTotal?: number | null;
  stayNights?: number;
};

export function RoomSelectCard({
  room,
  selected,
  onSelect,
  onViewDetails,
  stayTotal = null,
  stayNights = 0,
}: RoomSelectCardProps) {
  const { t, tr } = useI18n();
  const { format } = useCurrency();
  const topAmenities = room.amenities.slice(0, 3);
  const savePerNight = room.ota - room.rate;
  const urgencyKey = URGENCY[room.shortKey];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[14px] border-2 bg-white transition",
        selected
          ? "border-blue bg-sky/40 shadow-[0_0_0_3px_rgba(10,108,222,0.18)]"
          : "border-line hover:border-blue/40"
      )}
    >
      {/* Mobile: photo full-width 16:9 top */}
      <div className="relative aspect-video w-full overflow-hidden md:hidden">
        <SafeImage
          src={room.photos[0]}
          alt={tr(room.name)}
          fill
          className="object-cover"
          sizes="100vw"
        />
        {urgencyKey ? (
          <span className="absolute left-3 top-3 rounded-full bg-coral-deep px-2.5 py-1 text-[0.68rem] font-bold text-white">
            {t(urgencyKey)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-stretch md:gap-5">
        {/* Desktop: photo left 132x96 */}
        <div className="relative hidden h-24 w-[132px] shrink-0 overflow-hidden rounded-lg md:block">
          <SafeImage
            src={room.photos[0]}
            alt={tr(room.name)}
            fill
            className="object-cover"
            sizes="132px"
          />
        </div>

        {/* Content middle */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="font-display text-lg font-semibold text-ink">{tr(room.name)}</h3>
            {urgencyKey ? (
              <span className="hidden rounded-full bg-coral px-2.5 py-0.5 text-[0.68rem] font-bold text-white md:inline">
                {t(urgencyKey)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.78rem] font-semibold text-sub">{tr(room.meta)}</p>
          <div className="mt-2.5 flex gap-3 text-blue">
            {topAmenities.map((id) => (
              <AmenityIcon
                key={id}
                name={AMENITIES[id as AmenityId].icon}
                className="h-5 w-5"
              />
            ))}
          </div>
        </div>

        {/* Price block + buttons */}
        <div className="flex flex-col items-stretch gap-3 md:min-w-[148px] md:items-end md:text-right">
          <div>
            <div className="text-[20px] font-bold leading-tight text-ink">
              {format(room.rate)}
            </div>
            <div className="mt-0.5 text-[12px] font-semibold text-strike">
              <s>{format(room.ota)}</s> {t("chip.via")}
            </div>
            {savePerNight > 0 ? (
              <span className="mt-1.5 inline-block rounded-full bg-deal-bg px-2 py-0.5 text-[0.65rem] font-bold text-deal">
                {t("chip.save", { z: format(savePerNight) })}
              </span>
            ) : null}
            {/* The real price for these dates · nightly rates can differ. */}
            {stayTotal != null && stayNights > 0 ? (
              <div className="mt-2 border-t border-line pt-2 text-[0.78rem] font-bold text-ink">
                {t("bk.nightsCount", { n: stayNights })} ·{" "}
                <span className="text-blue">{format(stayTotal)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-blue hover:bg-sky/60"
            >
              {t("bk.viewDetails")}
            </button>
            <button
              type="button"
              onClick={onSelect}
              aria-pressed={selected}
              className={cn(
                "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition",
                selected ? "bg-blue-dark" : "bg-blue hover:bg-blue-dark"
              )}
            >
              {selected ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}
              {t("bk.select")}
            </button>
          </div>
        </div>
      </div>

      {selected ? (
        <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue text-white shadow-[0_4px_12px_rgba(10,108,222,0.4)] md:hidden">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
    </article>
  );
}
