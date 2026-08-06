"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function HeroTrustRow({
  className,
  compact,
}: {
  className?: string;
  /** Mobile: rating pill only, no secondary trust chain */
  compact?: boolean;
}) {
  const { t } = useI18n();

  return (
    <p
      className={cn(
        "tkh-hero-fade mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white/90",
        className
      )}
      style={{ animationDelay: "0.35s" }}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/14 px-3 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur-md">
        <span className="tracking-[1px] text-gold" aria-hidden>
          ★★★★★
        </span>
        <span>{t("hero.google", { n: "5.0" })}</span>
      </span>
      {!compact ? (
        <>
          <span aria-hidden>·</span>
          <span>{t("trust.1")}</span>
          <span aria-hidden>·</span>
          <span>{t("trust.freeShort")}</span>
        </>
      ) : null}
    </p>
  );
}
