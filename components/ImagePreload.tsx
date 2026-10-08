/// <reference types="react-dom/canary" />
import { preload } from "react-dom";
import { fallbackSrc, image, srcSet, type ImageId } from "@/lib/images";

/**
 * The LCP image's preload, in <head>: the same AVIF srcset and the exact
 * `sizes` the image renders with, fetchpriority high. <Picture priority>
 * calls this itself; use it directly only when the LCP image is drawn by
 * something else (a CSS background, a client component).
 */
export function ImagePreload({ id, sizes }: { id: ImageId; sizes: string }) {
  const entry = image(id);
  preload(fallbackSrc(entry), {
    as: "image",
    type: "image/avif",
    imageSrcSet: srcSet(entry.avif),
    imageSizes: sizes,
    fetchPriority: "high",
  });
  return null;
}
