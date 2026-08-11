"use client";

import { useConcierge } from "@/components/providers";
import { useHeroFabClearance } from "@/lib/useHeroFabClearance";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Instant FAB — pure CSS, no chat JS until idle / first open. */
export function ConciergeFab({
  offsetForBookBar = true,
  onBook = false,
  onOpen,
}: {
  offsetForBookBar?: boolean;
  onBook?: boolean;
  onOpen?: () => void;
}) {
  const { t } = useI18n();
  const { openConcierge } = useConcierge();
  const heroClearance = useHeroFabClearance();
  // Icon-only when clearing the hero pill or docked on the booking flow.
  const compact = heroClearance !== null || onBook;
  const label = t("cg.fab");

  const fabBottomClass =
    heroClearance !== null
      ? undefined
      : onBook
        ? // Sit ABOVE the sticky booking action bar on mobile; normal on desktop.
          "bottom-[calc(env(safe-area-inset-bottom,0px)+104px)] lg:bottom-6"
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
        "fixed right-[22px] z-fab flex items-center overflow-hidden rounded-full bg-navy text-[0.88rem] font-extrabold text-white shadow-[0_14px_40px_rgba(18,33,28,0.35)] transition-[max-width,padding,gap,background-color,transform,box-shadow] duration-200 ease-out hover:scale-[1.04] hover:bg-blue-dark hover:shadow-[0_18px_48px_rgba(18,33,28,0.45)] max-md:right-2.5",
        onBook ? "h-12 min-w-[48px]" : "h-[52px] min-w-[52px]",
        compact
          ? cn(
              "justify-center gap-0 px-0",
              onBook ? "max-w-[48px]" : "max-w-[52px]"
            )
          : "max-w-[240px] gap-2.5 px-5",
        fabBottomClass
      )}
      style={
        heroClearance !== null ? { bottom: heroClearance } : undefined
      }
      aria-label={label}
    >
      <span
        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#7FD79A]"
        aria-hidden
      />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200 ease-out",
          compact
            ? "m-0 max-w-0 opacity-0"
            : "max-w-[12rem] opacity-100"
        )}
      >
        {label}
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
