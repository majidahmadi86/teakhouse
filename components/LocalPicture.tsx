import { Picture } from "@/components/Picture";
import { imageIdFor } from "@/lib/images";
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
 * A house photo by its legacy base path · now served through the image
 * registry (lib/images.ts): content-hashed AVIF + WebP at every registered
 * width, the dominant-colour ground, and, below the fold, the decode-gated
 * unveil (components/Picture). A path the registry does not know (an owner
 * upload, say) falls back to the files beside it, exactly as before.
 *
 * The box is always reserved (intrinsic width and height on the <img>), so
 * nothing moves when the bytes arrive.
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
  const id = imageIdFor(base);
  if (id) {
    return (
      <Picture
        id={id}
        alt={alt}
        sizes={sizes}
        priority={priority}
        unveil={!priority}
        pictureClassName="h-full w-full"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
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
