import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { translate, type Lang } from "@/lib/translate";
import { cn } from "@/lib/utils";

type OfferCardProps = {
  n: "1" | "2" | "3";
  locale: Lang;
  className?: string;
};

/**
 * An offer as a quiet typographic card · a large teak numeral, the terms
 * line, the title and one sentence. No gradients, no loud badges, no
 * stand-in photograph. Pure (renders on the server).
 */
export function OfferCard({ n, locale, className }: OfferCardProps) {
  const t = (k: string) => translate(locale, k);
  return (
    <Link
      href="/offers"
      prefetch={false}
      className={cn(
        "group flex h-full flex-col rounded-card border border-line/80 bg-stone p-7 transition duration-300 ease-calm hover:-translate-y-0.5 hover:border-ink/20 hover:bg-white hover:shadow-lift md:p-8",
        className
      )}
    >
      <p className="font-display text-[44px] leading-none text-teak">{t(`off.${n}.numeral`)}</p>
      <p className="mt-6 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-sub">{t(`off.${n}.badge`)}</p>
      <h3 className="mt-2 text-[24px] leading-snug">{t(`off.${n}.title`)}</h3>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink/75">{t(`off.${n}.body`)}</p>
      <span className="link-quiet mt-auto pt-6">
        {t("off.more")}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
      </span>
    </Link>
  );
}
