import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Picture } from "@/components/Picture";
import { Price } from "@/components/Price";
import { isImageId } from "@/lib/images";
import type { CatalogueRoom } from "@/lib/rooms";
import { t, tr } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";
import { cn } from "@/lib/utils";

/**
 * A room in the catalogue · the home showcase and /rooms. The cover photo
 * is the room itself (lib/rooms.ts), never a stand-in.
 */
export function RoomCard({
  room,
  locale,
  sizes,
  large = false,
}: {
  room: CatalogueRoom;
  locale: Lang;
  sizes: string;
  large?: boolean;
}) {
  const cover = room.images[0];
  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/rooms/${room.slug}`}
        prefetch={false}
        className="relative block overflow-hidden rounded-card bg-ivory"
        aria-label={tr(locale, room.name)}
      >
        <div className={cn("relative", large ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-[4/3]")}>
          {cover && isImageId(cover.id) ? (
            <Picture
              id={cover.id}
              alt={tr(locale, cover.alt)}
              sizes={sizes}
              fill
              unveil
              className="transition duration-700 ease-calm group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-teak">{tr(locale, room.view)}</p>
        <h3 className="mt-2 text-[26px] leading-tight">
          <Link href={`/rooms/${room.slug}`} prefetch={false} className="transition hover:text-forest">
            {tr(locale, room.name)}
          </Link>
        </h3>
        <p className="mt-2 text-[15.5px] leading-relaxed text-ink/75">{tr(locale, room.intro)}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <p className="text-[14px] text-sub">
            {t(locale, "room.from")}{" "}
            <span className="text-[17px] font-semibold text-ink">
              <Price thb={room.rate} />
            </span>{" "}
            {t(locale, "room.night")}
          </p>
          <Link href={`/rooms/${room.slug}`} prefetch={false} className="link-quiet">
            {t(locale, "room.see")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
