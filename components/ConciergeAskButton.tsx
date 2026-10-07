"use client";

import { CONCIERGE_OPEN_EVENT } from "@/lib/conciergeEvents";

/**
 * "Ask the concierge about this" · opens the chat with a topic prefilled. It
 * needs no provider: it announces the request on window and the lazily loaded
 * concierge (components/ConciergeLazy) picks it up.
 */
export function ConciergeAskButton({
  topic,
  children,
  className,
}: {
  topic: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        window.dispatchEvent(new CustomEvent(CONCIERGE_OPEN_EVENT, { detail: topic }))
      }
    >
      {children}
    </button>
  );
}
