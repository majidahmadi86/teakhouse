"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CurrencyProvider } from "@/lib/currency";
import { GuestAuthProvider } from "@/lib/guestAuth";
import { I18nProvider } from "@/lib/i18n";
import { OwnerProvider } from "@/lib/ownerStore";

type ConciergeCtx = {
  isOpen: boolean;
  prefill: string;
  openConcierge: (prefill?: string) => void;
  closeConcierge: () => void;
};

const ConciergeContext = createContext<ConciergeCtx | null>(null);

export function ConciergeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  const openConcierge = useCallback((nextPrefill = "") => {
    setPrefill(nextPrefill);
    setIsOpen(true);
  }, []);

  const closeConcierge = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, prefill, openConcierge, closeConcierge }),
    [isOpen, prefill, openConcierge, closeConcierge]
  );

  return (
    <ConciergeContext.Provider value={value}>{children}</ConciergeContext.Provider>
  );
}

export function useConcierge() {
  const ctx = useContext(ConciergeContext);
  if (!ctx) throw new Error("useConcierge outside ConciergeProvider");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <CurrencyProvider>
        <GuestAuthProvider>
          <OwnerProvider>
            <ConciergeProvider>{children}</ConciergeProvider>
          </OwnerProvider>
        </GuestAuthProvider>
      </CurrencyProvider>
    </I18nProvider>
  );
}
