import Link from "next/link";
import { CinematicLink } from "@/components/motion/CinematicLink";
import {
  formatThb,
  translate,
  translateEntry,
  type Lang,
} from "@/lib/translate";
import type { Room } from "@/lib/rooms";

/**
 * v15 · Server-rendered room preview for the home below-fold · zero client JS.
 *
 * Editorial: the photograph, then the name in Cormorant over a hairline, the
 * facts in small capitals, and a "from" price in gold. Every block reserves
 * its height, so nothing shifts when the photograph lands. Prices show the base
 * currency (THB); /rooms and /book keep live currency switching.
 */
export function HomeRoomCard({ room, locale }: { room: Room; locale: Lang }) {
  return (
    <article className="group flex flex-col">
      <CinematicLink href={`/rooms/${room.slug}`} prefetch={false} className="block">
        <div
          className="tkh-vt-room relative aspect-[4/5] overflow-hidden bg-line"
          style={{ viewTransitionName: `room-${room.slug}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${room.photos[0]}?w=720&q=70&auto=format&fit=crop`}
            alt={translateEntry(locale, room.name)}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
          {room.urgency ? (
            <span className="luxe-caps absolute left-4 top-4 bg-white/90 px-2.5 py-1.5 text-[0.6rem] text-ink">
              {translateEntry(locale, room.urgency)}
            </span>
          ) : null}
        </div>
      </CinematicLink>
      <div className="flex min-h-[190px] flex-1 flex-col pt-6">
        <h3 className="font-display text-[1.75rem] leading-tight text-ink">
          {translateEntry(locale, room.name)}
        </h3>
        <span className="luxe-rule mt-3" aria-hidden />
        <p className="luxe-caps mt-4 min-h-[1.25rem] text-sub">
          {room.sizeM2} m² · {translateEntry(locale, room.bedType)} · {translateEntry(locale, room.view)}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <p className="font-display text-2xl text-ink">
            <span className="luxe-caps mr-2 text-gold">{translate(locale, "room.from")}</span>
            {formatThb(room.rate)}
            <span className="ml-2 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sub">
              {translate(locale, "room.night")}
            </span>
          </p>
          <Link href={`/book?room=${room.shortKey}`} prefetch={false} className="link-draw luxe-caps text-ink">
            {translate(locale, "room.book")} →
          </Link>
        </div>
      </div>
    </article>
  );
}
