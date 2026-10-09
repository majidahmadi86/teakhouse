"use client";

/**
 * The footer's fine-print link to the demo order panel · it needs no provider:
 * it announces the request on window and DemoModal opens.
 */
export function DemoFineButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("tkh:demo-open"))}
      className="cursor-pointer bg-transparent text-inherit underline decoration-ink/30 underline-offset-4 transition hover:text-ink hover:decoration-ink"
    >
      {label}
    </button>
  );
}
