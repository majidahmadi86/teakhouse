import { fallbackSrc, image, isImageId, srcSet } from "@/lib/images";
import { ROOM_CATALOGUE, type Bilingual } from "@/lib/rooms";

/**
 * A registered photograph flattened to plain props · what a client island
 * (the /book flow) receives from its server page, so the browser never loads
 * the whole image registry to show six room covers.
 */
export type MediaProps = {
  avif: string;
  webp: string;
  src: string;
  width: number;
  height: number;
  color: string;
  position?: string;
  alt: Bilingual;
};

export function mediaProps(id: string, alt: Bilingual, maxWidth?: number): MediaProps | null {
  if (!isImageId(id)) return null;
  const entry = image(id) as ReturnType<typeof image> & { focal?: readonly [number, number] };
  const focal = entry.focal;
  return {
    avif: srcSet(entry.avif, maxWidth),
    webp: srcSet(entry.webp, maxWidth),
    src: fallbackSrc(entry),
    width: entry.width,
    height: entry.height,
    color: entry.color,
    position: focal ? `${Math.round(focal[0] * 100)}% ${Math.round(focal[1] * 100)}%` : undefined,
    alt,
  };
}

/** Every room's cover, by slug · for the /book flow. */
export function roomCoverMedia(maxWidth = 1080): Record<string, MediaProps | null> {
  const out: Record<string, MediaProps | null> = {};
  for (const room of ROOM_CATALOGUE) {
    const cover = room.images[0];
    out[room.slug] = cover ? mediaProps(cover.id, cover.alt, maxWidth) : null;
  }
  return out;
}

/** The 768 px WebP of a registered image · the owner panel's room photos. */
export function imageUrl(id: string, width = 768): string {
  if (!isImageId(id)) return "";
  const entry = image(id);
  const pick = entry.webp.find(([w]) => w >= width) ?? entry.webp[entry.webp.length - 1];
  return pick ? pick[1] : "";
}
