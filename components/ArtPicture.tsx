import { fallbackSrc, image, objectPositionFor, srcSet, type ImageId } from "@/lib/images";
import { cn } from "@/lib/utils";

const PHONE = "(max-width: 767px)";
const WIDE = "(min-width: 768px)";

/**
 * An art-directed photograph · the phone gets its own crop (a 4:5 "-m"
 * registry entry framed on the focal point), wider screens the full frame.
 * Server HTML, no client JS. AVIF first with a WebP fallback, the dominant
 * colour as the ground, intrinsic sizes, never a blur placeholder.
 *
 * `priority` (an LCP hero): both crops are preloaded with media queries, so
 * each device fetches exactly one file, at fetchpriority high.
 */
export function ArtPicture({
  id,
  phoneId,
  alt,
  sizes = "100vw",
  phoneSizes = "100vw",
  priority = false,
  className,
}: {
  id: ImageId;
  phoneId?: ImageId;
  alt: string;
  sizes?: string;
  phoneSizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const wide = image(id);
  const phone = phoneId ? image(phoneId) : null;
  const ground = { backgroundColor: wide.color };
  return (
    <>
      {priority ? (
        <>
          {phone ? (
            <link
              rel="preload"
              as="image"
              type="image/avif"
              media={PHONE}
              href={phone.avif[phone.avif.length - 1][1]}
              imageSrcSet={srcSet(phone.avif)}
              imageSizes={phoneSizes}
              fetchPriority="high"
            />
          ) : null}
          <link
            rel="preload"
            as="image"
            type="image/avif"
            media={phone ? WIDE : undefined}
            href={wide.avif[wide.avif.length - 1][1]}
            imageSrcSet={srcSet(wide.avif)}
            imageSizes={sizes}
            fetchPriority="high"
          />
        </>
      ) : null}
      <picture className="absolute inset-0 block" style={ground}>
        {phone ? (
          <>
            <source type="image/avif" media={PHONE} srcSet={srcSet(phone.avif)} sizes={phoneSizes} />
            <source type="image/webp" media={PHONE} srcSet={srcSet(phone.webp)} sizes={phoneSizes} />
          </>
        ) : null}
        <source type="image/avif" srcSet={srcSet(wide.avif)} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(wide.webp)} sizes={sizes} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackSrc(wide)}
          alt={alt}
          width={wide.width}
          height={wide.height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : undefined}
          className={cn("h-full w-full object-cover", className)}
          style={{ ...ground, objectPosition: objectPositionFor(wide) }}
        />
      </picture>
    </>
  );
}
