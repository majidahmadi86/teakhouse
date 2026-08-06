import type { ImageLoaderProps } from "next/image";

/**
 * Unsplash CDN loader — sizes from next/image `sizes` + device DPR.
 * auto=format → AVIF/WebP; fit=crop; width never larger than requested.
 */
export default function unsplashLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    if (url.hostname !== "images.unsplash.com") {
      return src;
    }
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    return url.toString();
  } catch {
    return src;
  }
}

/** Strip baked size/quality so the loader owns delivery params. */
export function unsplashSrc(photoId: string): string {
  const id = photoId.startsWith("photo-") ? photoId : photoId;
  if (id.startsWith("http")) {
    try {
      const url = new URL(id);
      url.search = "";
      return url.toString();
    } catch {
      return id;
    }
  }
  return `https://images.unsplash.com/${id}`;
}
