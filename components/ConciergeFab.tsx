"use client";

import { useConcierge } from "@/components/providers";
import { useHeroFabClearance } from "@/lib/useHeroFabClearance";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Instant FAB — pure CSS, no chat JS until idle / first open. */
export function ConciergeFab({
  offsetForBookBar = true,
  onOpen,
}: {
  offsetForBookBar?: boolean;
  onOpen?: () => void;
}) {
  const { t } = useI18n();
  const { openConcierge } = useConcierge();
  const heroClearance = useHeroFabClearance();
  const compact = heroClearance !== null;

  const fabBottomClass =
    heroClearance !== null
      ? undefined
      : offsetForBookBar
        ? "bottom-[76px] md:bottom-6"
        : "bottom-6";

  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        openConcierge();
      }}
      className={cn(
        "fixed right-[22px] z-fab flex items-center overflow-hidden rounded-full bg-navy text-[0.88rem] font-extrabold text-white shadow-[0_14px_40px_rgba(18,33,28,0.35)] transition-[width,padding,background-color,transform,box-shadow] duration-200 hover:scale-[1.04] hover:bg-blue-dark hover:shadow-[0_18px_48px_rgba(18,33,28,0.45)] max-md:right-2.5",
        compact
          ? "h-[52px] w-[52px] justify-center gap-0 px-0 py-0"
          : "h-auto w-auto gap-2.5 px-5 py-3.5",
        fabBottomClass
      )}
      style={
        heroClearance !== null ? { bottom: heroClearance } : undefined
      }
      aria-label={t("cg.fab")}
    >
      <span
        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#7FD79A]"
        aria-hidden
      />
      <span
        className={cn(
          "whitespace-nowrap transition-[max-width,opacity,margin] duration-200",
          compact
            ? "ml-0 max-w-0 opacity-0"
            : "ml-0 max-w-[12rem] opacity-100"
        )}
      >
        {t("cg.fab")}
      </span>
    </button>
  );
}

export function ConciergeAskButton({
  topic,
  children,
  className,
}: {
  topic: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { openConcierge } = useConcierge();

  return (
    <button
      type="button"
      onClick={() => openConcierge(topic)}
      className={className}
    >
      {children}
    </button>
  );
}
