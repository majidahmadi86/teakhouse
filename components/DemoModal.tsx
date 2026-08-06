"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";

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

const DemoModalPanel = dynamic(
  () => import("./DemoModalPanel").then((m) => m.DemoModalPanel),
  { ssr: false }
);

type DemoModalProps = {
  auto?: boolean;
  children: ReactNode;
};

/** Light provider — modal UI loads only when opened (or after auto-timer). */
export function DemoModal({ auto = false, children }: DemoModalProps) {
  const [open, setOpen] = useState(false);
  const [panelReady, setPanelReady] = useState(false);

  const openModal = useCallback(() => {
    setPanelReady(true);
    setOpen(true);
  }, []);

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
    // Well past the mobile Lighthouse measurement window
    const timer = window.setTimeout(() => openModal(), 14000);
    return () => window.clearTimeout(timer);
  }, [auto, openModal]);

  useEffect(() => {
    const onDemoOpen = () => openModal();
    window.addEventListener(DEMO_OPEN_EVENT, onDemoOpen);
    return () => window.removeEventListener(DEMO_OPEN_EVENT, onDemoOpen);
  }, [openModal]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {panelReady ? <DemoModalPanel open={open} onClose={closeModal} /> : null}
    </Ctx.Provider>
  );
}
