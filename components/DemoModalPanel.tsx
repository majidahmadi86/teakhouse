"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
/** Demo funnel · link to the Hotelier product page (demo builds only). */
const ABOUT_URL = "https://mikaro.studio/hotelier";

const SECONDARY_BTN =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-line px-7 text-[15px] font-bold text-ink transition hover:border-blue hover:text-blue";

export function DemoModalPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

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
          "grid w-full max-w-[720px] overflow-hidden rounded-[18px] bg-white shadow-panel transition-transform sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]",
          open ? "translate-y-0" : "translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
      >
        <div className="flex flex-col bg-navy px-8 py-10 text-white">
          <Logo light showTag={false} className="mb-6" />
          <p className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
            Mikaro Studio
          </p>
          <ul className="mt-auto space-y-4">
            {(["dm.l1", "dm.l2", "dm.l3"] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-[0.94rem] font-semibold">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={3} />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 w-fit rounded-full bg-gold/20 px-3 py-1.5 text-[0.72rem] font-semibold text-gold">
            Sandbox · resets hourly · edit anything
          </p>
        </div>

        <div className="flex flex-col justify-center px-8 py-10">
          <h3 id="demo-modal-title" className="mb-3.5 font-display text-[1.4rem] text-ink">
            {t("dm.h3")}
          </h3>
          <p className="mb-8 text-[0.95rem] text-sub">{t("dm.p")}</p>
          <div className="flex flex-wrap gap-3">
            {DEMO ? (
              <a
                href={ABOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                About this platform
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className={DEMO ? SECONDARY_BTN : "btn-primary"}
            >
              {t("dm.cta")}
            </button>
            <Link href="/owner" onClick={onClose} className={SECONDARY_BTN}>
              {t("dm.owner")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
