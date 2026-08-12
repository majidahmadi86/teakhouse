import { cn } from "@/lib/utils";

type LocalPictureProps = {
  /** Path without the width/extension suffix, e.g. "/images/facilities/pool". */
  base: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  /** Above the fold · eager + high priority instead of lazy. */
  priority?: boolean;
};

/**
 * Locally hosted AVIF with a WebP fallback · a pure server component with no
 * client JS and no image optimizer in the request path. The files are encoded
 * ahead of time at 640 and 1280 by scripts/build-facility-images.js, so the
 * browser picks a width from `sizes` and downloads exactly one of them.
 *
 * width/height are always set so the box is reserved before the bytes land ·
 * these images sit below the fold and must not move anything when they arrive.
 */
export function LocalPicture({
  base,
  alt,
  width,
  height,
  sizes,
  className,
  priority = false,
}: LocalPictureProps) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w`}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w`}
        sizes={sizes}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-1280.webp`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn("h-full w-full object-cover", className)}
      />
    </picture>
  );
}
