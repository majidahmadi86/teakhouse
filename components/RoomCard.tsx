"use client";

import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { PriceChip } from "@/components/PriceChip";
import { AmenityIcon } from "@/components/ui/AmenityIcon";
import { AMENITIES, type AmenityId } from "@/lib/amenities";
import { useI18n } from "@/lib/i18n";
import type { Room } from "@/lib/rooms";
import { formatBaht } from "@/lib/utils";
import { cn } from "@/lib/utils";

type RoomCardProps = {
  room: Room;
  descriptionKey?: string;
  variant?: "preview" | "full";
  className?: string;
};

export function RoomCard({
  room,
  descriptionKey,
  variant = "preview",
  className,
}: RoomCardProps) {
  const { t, tr } = useI18n();
  const topAmenities = room.amenities.slice(0, 3);

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_8px_30px_rgba(23,33,29,0.08)] transition hover:-translate-y-1.5 hover:shadow-panel",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage
          src={room.photos[0]}
          alt={tr(room.name)}
          fill
          className="object-cover transition duration-700 hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute bottom-3.5 left-3.5">
          <PriceChip rate={room.rate} ota={room.ota} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <h3 className="font-display text-xl">{tr(room.name)}</h3>
        <p className="flex flex-wrap gap-3.5 text-[0.8rem] font-semibold text-strike">
          <span>{room.sizeM2} m²</span>
          <span>{tr(room.bedType)}</span>
          <span>{tr(room.view)}</span>
          {variant === "full" ? (
            <span>{t("rooms.sleeps", { n: room.capacity })}</span>
          ) : null}
        </p>
        {variant === "full" && descriptionKey ? (
          <p className="text-[0.93rem]">{t(descriptionKey)}</p>
        ) : null}
        {variant === "full" ? (
          <div className="flex gap-3 text-brand">
            {topAmenities.map((id) => (
              <AmenityIcon key={id} name={AMENITIES[id as AmenityId].icon} className="h-5 w-5" />
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3.5">
          <div className="font-display text-2xl">
            {formatBaht(room.rate)}{" "}
            <small className="font-sans text-[0.72rem] font-semibold text-strike">
              {t("room.night")}
            </small>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/rooms/${room.slug}`}
              className="rounded-full border border-ink/25 px-5 py-2.5 text-[0.84rem] font-bold transition hover:border-brand hover:bg-brand/5"
            >
              {t("room.see")}
            </Link>
            <Link
              href={`/book?room=${room.shortKey}`}
              className="rounded-full bg-gold px-5 py-2.5 text-[0.84rem] font-bold text-white transition hover:bg-[#C29A5E]"
            >
              {t("room.book")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
