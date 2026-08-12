import { MessageCircle } from "lucide-react";

/**
 * Concierge FAB · static server HTML · ZERO JavaScript required to exist or be
 * visible. Rendered directly in the guest/home layouts (server components), so
 * it is present in the raw HTML response (curl it and find data-concierge-fab).
 * Styling and positioning are pure CSS (Tailwind utilities · no runtime). The
 * click is enhanced by ConciergeLauncher, which opens the chat panel (deferred)
 * and shows a loading sheet until it arrives · the button is never dead.
 *
 * Position clears the mobile bottom bars (book action bar ~87px, mobile book
 * bar ~76px) via a universal bottom offset · desktop drops to 1.5rem. Honours
 * the safe-area inset and never covers content (bottom-right, off the flow).
 *
 * v14 · `compact` is set on the home page, where the hero's booking widget
 * occupies the same corner on a phone. Compact renders an icon-only circle and
 * is the FAIL-SAFE DEFAULT: FabHeroClearance expands it back to the labelled
 * pill only once the booking widget has scrolled out of view, so if that script
 * never runs the button simply stays small and nothing is ever covered.
 */
export function ConciergeFabStatic({
  label,
  compact,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      data-concierge-fab
      {...(compact ? { "data-fab-compact": "" } : {})}
      aria-label={label}
      className="fixed right-4 z-fab flex h-[52px] min-w-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-navy px-5 text-[0.88rem] font-extrabold text-white shadow-[0_14px_40px_rgba(18,33,28,0.35)] transition hover:scale-[1.04] hover:bg-blue-dark bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] max-[480px]:right-2.5 lg:bottom-6"
    >
      <span
        className="tkh-fab-dot h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#7FD79A]"
        aria-hidden
      />
      <MessageCircle
        className="tkh-fab-icon hidden h-5 w-5 shrink-0"
        aria-hidden
      />
      <span className="tkh-fab-label">{label}</span>
    </button>
  );
}
