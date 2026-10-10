import { ArtPicture } from "@/components/ArtPicture";
import type { ImageId } from "@/lib/images";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  /** A registered photograph (lib/images.ts) · the wide frame. */
  imageId?: ImageId;
  /** Its 4:5 phone crop ("-m" registry entry), when there is one. */
  phoneImageId?: ImageId;
  /**
   * An owner-uploaded photograph (dining and events heroes): a plain <img>,
   * no optimizer, used instead of the registered one when the owner set it.
   */
  image?: string;
  alt?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  className?: string;
  /** An action under the lead (Reserve a table). */
  cta?: React.ReactNode;
};

/**
 * The page opening · server HTML, zero client JS, the same composition on
 * every guest page: the eyebrow, a large calm title and the lead on the
 * white-stone ground, then the page's photograph full bleed beneath it (a
 * 4:5 crop on phones). Text never sits on a photograph, so no veil is ever
 * needed. A page whose subject no photograph passed the art direction for
 * (offers, facilities, location) opens with the words alone, which is the
 * same composition, not a gap.
 */
export function PageHero({
  imageId,
  phoneImageId,
  image,
  alt = "",
  eyebrow,
  title,
  lead,
  className,
  cta,
}: PageHeroProps) {
  const hasPhoto = Boolean(image || imageId);
  return (
    <section className={cn("bg-stone", className)}>
      <div className={cn("wrap pt-12 md:pt-20", hasPhoto ? "pb-10 md:pb-14" : "pb-14 md:pb-24")}>
        <div className="max-w-[860px]">
          <p className="tkh-hero-in eyebrow">{eyebrow}</p>
          <h1 className="tkh-hero-rise mt-4 md:mt-5">{title}</h1>
          {lead ? <p className="tkh-hero-in tkh-hero-in-2 lead mt-5 max-w-[60ch] md:mt-6">{lead}</p> : null}
          {cta ? <div className="mt-8">{cta}</div> : null}
        </div>
        {!hasPhoto ? <span className="rule mt-12 md:mt-16" aria-hidden /> : null}
      </div>
      {hasPhoto ? (
        <div className="relative mx-auto aspect-[4/5] max-h-[72svh] w-full max-w-[1600px] overflow-hidden bg-ivory sm:aspect-[16/9] md:aspect-[21/9] md:max-h-[640px]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={alt}
              fetchPriority="high"
              decoding="async"
              className="tkh-ken-burns-live absolute inset-0 h-full w-full object-cover"
            />
          ) : imageId ? (
            <ArtPicture
              id={imageId}
              phoneId={phoneImageId}
              alt={alt}
              priority
              className="tkh-ken-burns-live"
              sizes="(min-width: 1600px) 1600px, 100vw"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
