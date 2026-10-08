import { IMAGE_DATA } from "./images.generated";

/**
 * The image registry · one module that knows every local image the site shows
 * (v17 A1/A2, generalised from the five-star branch's FsPicture/ImagePreload).
 *
 * Each image is registered by id ("dining/hero", "dishes/pad-thai") in
 * scripts/images/images.config.mjs and built by scripts/images/build-images.mjs
 * into lib/images.generated.ts:
 *
 *   width / height  the intrinsic size · every <img> carries it (no CLS)
 *   color           the dominant colour · the ground the slot shows until
 *                   the image is there (never a blur placeholder)
 *   avif / webp     [width, url] variants · AVIF first, WebP fallback,
 *                   content-hashed names cached for a year (immutable)
 *
 * Pages use it through components/Picture.tsx (<Picture id sizes />, with
 * `priority` for the LCP image and `unveil` for the decode-gated reveal below
 * the fold) and components/ImagePreload.tsx (the LCP preload, exact sizes,
 * fetchpriority high). Phase 4 swaps the photography by re-registering ids;
 * no page changes.
 */

export type ImageId = keyof typeof IMAGE_DATA;

export type ImageVariant = readonly [width: number, url: string];

export type ImageEntry = {
  width: number;
  height: number;
  color: string;
  avif: readonly ImageVariant[];
  webp: readonly ImageVariant[];
};

export function isImageId(id: string): id is ImageId {
  return Object.prototype.hasOwnProperty.call(IMAGE_DATA, id);
}

export function image(id: ImageId): ImageEntry {
  return IMAGE_DATA[id] as unknown as ImageEntry;
}

/** "url 640w, url 1280w" */
export function srcSet(variants: readonly ImageVariant[], maxWidth?: number): string {
  return variants
    .filter(([w]) => !maxWidth || w <= maxWidth)
    .map(([w, url]) => `${url} ${w}w`)
    .join(", ");
}

/** The largest WebP · the <img src> for browsers that ignore <source>. */
export function fallbackSrc(entry: ImageEntry): string {
  return entry.webp[entry.webp.length - 1]?.[1] ?? entry.avif[entry.avif.length - 1][1];
}

/**
 * A legacy local path ("/images/dining/hero", or a seeded "-1280.webp" file
 * path an owner has not replaced) to its registry id, when it is one.
 */
export function imageIdFor(path: string | null | undefined): ImageId | null {
  if (!path) return null;
  const base = path
    .replace(/^\/images\//, "")
    .replace(/-(128|256|640|828|1280|1920)\.(avif|webp|jpg)$/, "")
    .replace(/\.(avif|webp|jpg)$/, "");
  return isImageId(base) ? base : null;
}

export { liveRemote } from "./remoteImages";
