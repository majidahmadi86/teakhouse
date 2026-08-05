"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DM_KEY = "tkh-dm";

type DemoModalCtx = {
  open: () => void;
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
  const closeModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open: openModal, close: closeModal }),
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
    const timer = window.setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(DM_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [auto]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className={cn(
          "fixed inset-0 z-[90] grid place-items-center bg-brand/55 p-5 backdrop-blur-sm transition-opacity",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeModal}
        role="presentation"
      >
        <div
          className={cn(
            "max-w-[520px] rounded-[18px] bg-white p-9 shadow-panel transition-transform",
            open ? "translate-y-0" : "translate-y-4"
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <p className="mb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
            Mikaro Studio
          </p>
          <h3 id="demo-modal-title" className="mb-3.5 font-display text-[1.4rem]">
            {t("dm.h3")}
          </h3>
          <p className="text-[0.95rem]">{t("dm.p")}</p>
          <ul className="my-5 list-none space-y-0">
            {(["dm.l1", "dm.l2", "dm.l3"] as const).map((key) => (
              <li
                key={key}
                className="relative py-2.5 pl-8 text-[0.94rem] font-semibold before:absolute before:left-0 before:top-3.5 before:h-4 before:w-4 before:rounded-full before:bg-gold before:content-['']"
              >
                {t(key)}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-2"
            >
              {t("dm.cta")}
            </button>
            <Link
              href="/owner"
              className="rounded-full border border-ink/25 px-7 py-3.5 text-sm font-bold transition hover:border-brand hover:bg-brand/5"
            >
              {t("dm.owner")}
            </Link>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
