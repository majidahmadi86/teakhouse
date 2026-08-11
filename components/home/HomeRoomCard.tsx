import Link from "next/link";
import {
  formatThb,
  translate,
  translateEntry,
  type Lang,
} from "@/lib/translate";
import type { Room } from "@/lib/rooms";

/**
 * Server-rendered room preview for the home below-fold · zero client JS.
 * Prices show the base currency (THB); the full /rooms detail keeps live
 * currency switching. Mirrors RoomCard's preview markup.
 */
export function HomeRoomCard({ room, locale }: { room: Room; locale: Lang }) {
  const save = room.ota - room.rate;

  return (
    <article className="group tkh-card flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${room.photos[0]}?w=640&q=70&auto=format&fit=crop`}
          alt={translateEntry(locale, room.name)}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex min-h-[56px] flex-wrap items-end gap-2">
          <div className="space-y-2">
            <div className="min-h-[1.5rem]">
              {room.urgency ? (
                <span className="urgency-chip">
                  {translateEntry(locale, room.urgency)}
                </span>
              ) : null}
            </div>
            <div className="inline-flex min-h-[34px] flex-wrap items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 shadow-card">
              <span className="text-sm font-bold text-blue">
                {translate(locale, "chip.direct")} {formatThb(room.rate)}
              </span>
              <span className="text-xs text-strike line-through">
                {formatThb(room.ota)}
              </span>
              {save > 0 ? (
                <span className="rounded-full bg-deal-bg px-2 py-0.5 text-[0.68rem] font-bold text-deal">
                  {translate(locale, "chip.save", { z: formatThb(save) })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="flex min-h-[210px] flex-1 flex-col gap-2.5 p-6 md:min-h-[230px]">
        <h3 className="font-display text-xl text-ink">
          {translateEntry(locale, room.name)}
        </h3>
        <p className="flex min-h-[1.25rem] flex-wrap gap-3.5 text-[0.8rem] font-semibold text-sub">
          <span>{room.sizeM2} m²</span>
          <span>{translateEntry(locale, room.bedType)}</span>
          <span>{translateEntry(locale, room.view)}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
          <div className="font-display text-2xl text-ink">
            {formatThb(room.rate)}{" "}
            <small className="font-sans text-[0.72rem] font-semibold text-strike">
              {translate(locale, "room.night")}
            </small>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/rooms/${room.slug}`}
              className="rounded-full border border-line px-5 py-2.5 text-[0.84rem] font-bold text-ink transition hover:border-blue hover:bg-sky"
            >
              {translate(locale, "room.see")}
            </Link>
            <Link
              href={`/book?room=${room.shortKey}`}
              className="btn-primary px-5 py-2.5 text-[0.84rem]"
            >
              {translate(locale, "room.book")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
