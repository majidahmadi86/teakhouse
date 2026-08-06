"use client";

import { useConcierge } from "@/components/providers";
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
  const fabBottom = offsetForBookBar
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
        "fixed right-[22px] z-fab flex items-center gap-2.5 rounded-full bg-navy px-5 py-3.5 text-[0.88rem] font-extrabold text-white shadow-[0_14px_40px_rgba(18,33,28,0.35)] transition duration-150 hover:scale-[1.04] hover:bg-blue-dark hover:shadow-[0_18px_48px_rgba(18,33,28,0.45)] max-md:right-2.5",
        fabBottom
      )}
      aria-label={t("cg.fab")}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#7FD79A]" aria-hidden />
      {t("cg.fab")}
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
