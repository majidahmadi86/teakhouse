import { image, srcSet, type ImageId } from "@/lib/images";

/**
 * The LCP image's preload: the same AVIF srcset and the exact `sizes` the
 * image renders with, fetchpriority high. React hoists it into <head>.
 *
 * Rendered as an element, not through ReactDOM.preload(): a preload hint
 * travels in the page's RSC payload, so every Link that prefetched a static
 * page would also fetch that page's hero image on the CURRENT page. As an
 * element it only exists once the page is actually shown.
 */
export function ImagePreload({ id, sizes }: { id: ImageId; sizes: string }) {
  const entry = image(id);
  return (
    <link
      rel="preload"
      as="image"
      type="image/avif"
      href={entry.avif[entry.avif.length - 1][1]}
      imageSrcSet={srcSet(entry.avif)}
      imageSizes={sizes}
      fetchPriority="high"
    />
  );
}
