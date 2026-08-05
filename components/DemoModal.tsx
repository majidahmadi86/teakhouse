"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DM_KEY = "tkh-dm2";
const DEMO_OPEN_EVENT = "tkh:demo-open";

type DemoModalCtx = {
  open: () => void;
  openDemo: () => void;
  close: () => void;
};

const Ctx = createContext<DemoModalCtx | null>(null);

export function useDemoModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoModal outside DemoModalProvider");
  return ctx;
}

type DemoModalProps = {
  auto?: boolean;
  children: ReactNode;
};

export function DemoModal({ auto = false, children }: DemoModalProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);

  const closeModal = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DM_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ open: openModal, openDemo: openModal, close: closeModal }),
    [openModal, closeModal]
  );

  useEffect(() => {
    if (!auto) return;
    let seen = false;
    try {
      seen = localStorage.getItem(DM_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(timer);
  }, [auto]);

  useEffect(() => {
    const onDemoOpen = () => openModal();
    window.addEventListener(DEMO_OPEN_EVENT, onDemoOpen);
    return () => window.removeEventListener(DEMO_OPEN_EVENT, onDemoOpen);
  }, [openModal]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className={cn(
          "fixed inset-0 z-modal grid place-items-center bg-navy/55 p-5 backdrop-blur-sm transition-opacity",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeModal}
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
            <p className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber">
              Mikaro Studio
            </p>
            <ul className="mt-auto space-y-4">
              {(["dm.l1", "dm.l2", "dm.l3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3 text-[0.94rem] font-semibold">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber" strokeWidth={3} />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center px-8 py-10">
            <h3 id="demo-modal-title" className="mb-3.5 font-display text-[1.4rem] text-ink">
              {t("dm.h3")}
            </h3>
            <p className="mb-8 text-[0.95rem] text-sub">{t("dm.p")}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={closeModal} className="btn-primary">
                {t("dm.cta")}
              </button>
              <Link
                href="/owner"
                onClick={closeModal}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-7 text-[15px] font-bold text-ink transition hover:border-blue hover:text-blue"
              >
                {t("dm.owner")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
