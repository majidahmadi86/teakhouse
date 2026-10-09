import type { MediaProps } from "@/lib/roomMedia";
import { cn } from "@/lib/utils";

/**
 * A registered photograph from flattened props (lib/roomMedia) · usable in a
 * client island. AVIF first, WebP fallback, intrinsic size, the dominant
 * colour as the ground, never a blur placeholder.
 */
export function MediaPicture({
  media,
  alt,
  sizes,
  className,
  priority = false,
}: {
  media: MediaProps;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture className="absolute inset-0 block" style={{ backgroundColor: media.color }}>
      <source type="image/avif" srcSet={media.avif} sizes={sizes} />
      <source type="image/webp" srcSet={media.webp} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src}
        alt={alt}
        width={media.width}
        height={media.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("h-full w-full object-cover", className)}
        style={{ backgroundColor: media.color, objectPosition: media.position }}
      />
    </picture>
  );
}
