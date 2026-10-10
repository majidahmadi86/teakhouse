import { ImagePreload } from "@/components/ImagePreload";
import { fallbackSrc, image, objectPositionFor, srcSet, type ImageId } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * A registered image (lib/images.ts) · server HTML, no client JS.
 *
 * - AVIF first, WebP fallback, both as width descriptors with the caller's
 *   exact `sizes`, so the browser downloads one file of the right width
 * - the intrinsic width and height on the <img> (the box is reserved, CLS 0)
 * - the image's dominant colour as the ground of its slot until it is there
 * - `priority` (the LCP image): eager, fetchpriority high, and a preload in
 *   <head> with the same srcset and sizes (ImagePreload)
 * - `unveil` (below the fold): a clip-path reveal that starts only once
 *   img.decode() has resolved (lib/headScripts.ts), so a half-loaded image is
 *   never on screen; with scripting off or reduced motion it simply shows
 * - `fill`: the image covers its positioned parent
 *
 * Never a blur placeholder.
 */
export function Picture({
  id,
  alt,
  sizes,
  className,
  pictureClassName,
  priority = false,
  unveil,
  fill = false,
  objectPosition,
  maxWidth,
}: {
  id: ImageId;
  alt: string;
  /** The rendered width at each breakpoint · exact, it picks the file. */
  sizes: string;
  className?: string;
  pictureClassName?: string;
  priority?: boolean;
  unveil?: boolean;
  fill?: boolean;
  objectPosition?: string;
  /** Skip variants wider than this (a small slot never needs the 1280). */
  maxWidth?: number;
}) {
  // Every photograph below the fold unveils unless the caller says otherwise.
  if (unveil === undefined) unveil = !priority;
  const entry = image(id);
  // The caller's position wins; otherwise the registry's focal point, so a
  // cover crop keeps the subject in frame.
  const position = objectPosition ?? objectPositionFor(entry);
  const avif = srcSet(entry.avif, maxWidth);
  const webp = srcSet(entry.webp, maxWidth);
  const ground = { backgroundColor: entry.color };
  return (
    <>
    {priority ? <ImagePreload id={id} sizes={sizes} /> : null}
    <picture
      suppressHydrationWarning
      className={cn(
        unveil && "tkh-unveil",
        fill ? "absolute inset-0 block" : unveil && "block",
        pictureClassName
      )}
      style={unveil || fill ? ground : undefined}
    >
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        suppressHydrationWarning
        src={fallbackSrc(entry)}
        alt={alt}
        width={entry.width}
        height={entry.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={cn(fill && "h-full w-full object-cover", className)}
        style={{ ...ground, ...(position ? { objectPosition: position } : {}) }}
      />
    </picture>
    </>
  );
}
