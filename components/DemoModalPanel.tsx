"use client";

import { Check, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  DEMO_DETAILS_URL,
  DEMO_LINE_URL,
  type DemoStrings,
} from "@/lib/demoStrings";

const SECONDARY_BTN =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-line px-7 text-[15px] font-bold text-ink transition hover:border-blue hover:text-blue";

/** LINE brand green. */
const LINE_BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#06C755] px-7 text-[15px] font-bold text-white shadow-[0_6px_20px_rgba(6,199,85,0.35)] transition hover:brightness-105";

/**
 * Order panel · repurposed demo modal. Copy arrives as server-resolved props
 * (no client i18n dependency), so it follows the site locale on every route.
 */
export function DemoModalPanel({
  open,
  onClose,
  strings,
}: {
  open: boolean;
  onClose: () => void;
  strings: DemoStrings;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-modal grid place-items-center bg-navy/55 p-5 backdrop-blur-sm transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "relative grid w-full max-w-[720px] overflow-hidden rounded-[18px] bg-white shadow-panel transition-transform sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]",
          open ? "translate-y-0" : "translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-order-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={strings.close}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white sm:text-ink/60 sm:hover:bg-ink/10 sm:hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left · brand + value props */}
        <div className="flex flex-col bg-navy px-8 py-10 text-white">
          <Logo light showTag={false} className="mb-6" />
          <p className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
            Mikaro Studio
          </p>
          <ul className="mt-auto space-y-4">
            {[strings.l1, strings.l2, strings.l3].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 text-[0.94rem] font-semibold"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                  strokeWidth={3}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right · order action */}
        <div className="flex flex-col justify-center px-8 py-10">
          <h3
            id="demo-order-title"
            className="mb-3.5 font-display text-[1.4rem] text-ink"
          >
            {strings.title}
          </h3>
          <p className="mb-8 text-[0.95rem] text-sub">{strings.line}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={DEMO_LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={LINE_BTN}
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C6.48 2 2 5.64 2 10.13c0 4.02 3.55 7.39 8.35 8.03.32.07.77.21.88.49.1.25.06.64.03.9l-.14.86c-.04.25-.2.99.87.54 1.07-.45 5.76-3.39 7.86-5.81C21.36 13.51 22 11.9 22 10.13 22 5.64 17.52 2 12 2z" />
              </svg>
              {strings.primary}
            </a>
            <a
              href={DEMO_DETAILS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_BTN}
            >
              {strings.secondary}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
