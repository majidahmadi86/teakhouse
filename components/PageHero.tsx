"use client";

import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  lead: string;
  className?: string;
  /** CSS object-position for art direction under the title. */
  objectPosition?: string;
};

export function PageHero({
  image,
  alt,
  eyebrow,
  title,
  lead,
  className,
  objectPosition = "center",
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[52svh] items-end overflow-hidden pb-[60px] pt-28 text-white",
        className
      )}
    >
      <div className="absolute inset-0 -z-10">
        <SafeImage
          src={image}
          alt={alt}
          fill
          priority
          quality={78}
          sizes="(max-width: 768px) 100vw, 1600px"
          className="scale-[1.02] object-cover"
          style={{ objectPosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-navy/50 to-navy/85" />
      </div>
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gold hero-text-shadow">
          {eyebrow}
        </p>
        <h1 className="max-w-[16ch] text-balance text-white hero-text-shadow">{title}</h1>
        <p className="mt-5 max-w-[56ch] text-[1.08rem] leading-relaxed text-white/90 hero-text-shadow">
          {lead}
        </p>
      </div>
    </section>
  );
}
