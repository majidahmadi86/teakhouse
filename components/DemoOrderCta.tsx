"use client";

/** Demo bar order CTA · opens the order modal via the shared window event. */
export function DemoOrderCta({
  label,
  shortLabel,
}: {
  label: string;
  shortLabel: string;
}) {
  const openOrder = () => {
    window.dispatchEvent(new Event("tkh:demo-open"));
  };

  return (
    <button
      type="button"
      onClick={openOrder}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy shadow-[0_1px_10px_rgba(232,169,61,.45)] transition hover:brightness-110 sm:px-3"
    >
      <svg
        className="h-3 w-3 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        aria-hidden
      >
        <path d="M7 17L17 7M17 7H8M17 7v9" />
      </svg>
      <span className="min-[380px]:hidden">{shortLabel}</span>
      <span className="hidden min-[380px]:inline">{label}</span>
    </button>
  );
}
