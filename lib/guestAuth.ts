"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Booking } from "./ownerTypes";

/**
 * v15 · Guest account · the session is an HttpOnly cookie set by /api/account.
 * Nothing secret lives in localStorage any more; the only thing kept there is
 * a hint that a session probably exists, so the account page can skip the
 * sign-in redirect flash on the first paint.
 */

export type GuestUser = {
  id: string;
  name: string;
  email: string;
  bookingIds: string[];
  bookings: Booking[];
};

const HINT_KEY = "tkh-user";

type GuestAuthCtx = {
  user: GuestUser | null;
  hydrated: boolean;
  /** Returns error key or null on success. */
  signUp: (name: string, email: string, password: string, bookingId?: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  attachBooking: (bookingId: string) => void;
  updateUser: (patch: Partial<Pick<GuestUser, "name" | "email">>) => void;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<GuestAuthCtx | null>(null);

function setHint(on: boolean) {
  try {
    if (on) localStorage.setItem(HINT_KEY, "1");
    else localStorage.removeItem(HINT_KEY);
  } catch {
    /* ignore */
  }
}

async function post(body: Record<string, unknown>): Promise<Response> {
  return fetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
}

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account", { credentials: "same-origin", cache: "no-store" });
      if (res.ok) {
        const u = (await res.json()) as GuestUser;
        setUser(u);
        setHint(true);
      } else {
        setUser(null);
        setHint(false);
      }
    } catch {
      /* keep current */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const signUp = useCallback(
    async (name: string, email: string, password: string, bookingId?: string): Promise<string | null> => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (!trimmedName || !trimmedEmail || !password) return "missing";
      const res = await post({ action: "signup", name: trimmedName, email: trimmedEmail, password, bookingId });
      if (res.status === 409) return "exists";
      if (!res.ok) return "missing";
      const u = (await res.json()) as GuestUser;
      setUser(u);
      setHint(true);
      return null;
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return "missing";
    const res = await post({ action: "signin", email: trimmedEmail, password });
    if (!res.ok) return "invalid";
    const u = (await res.json()) as GuestUser;
    setUser(u);
    setHint(true);
    return null;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setHint(false);
    void post({ action: "signout" });
  }, []);

  const attachBooking = useCallback((bookingId: string) => {
    setUser((prev) =>
      prev && !prev.bookingIds.includes(bookingId)
        ? { ...prev, bookingIds: [...prev.bookingIds, bookingId] }
        : prev
    );
    void post({ action: "attach", bookingId }).then(async (res) => {
      if (res.ok) setUser((await res.json()) as GuestUser);
    });
  }, []);

  const updateUser = useCallback(
    (patch: Partial<Pick<GuestUser, "name" | "email">>) => {
      if (!user) return;
      setUser((prev) => (prev ? { ...prev, ...patch } : prev));
      void post({ action: "update", patch });
    },
    [user]
  );

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    const res = await post({ action: "cancel", bookingId });
    if (!res.ok) return false;
    setUser((await res.json()) as GuestUser);
    return true;
  }, []);

  const value = useMemo(
    () => ({ user, hydrated, signUp, signIn, signOut, attachBooking, updateUser, cancelBooking, refresh }),
    [user, hydrated, signUp, signIn, signOut, attachBooking, updateUser, cancelBooking, refresh]
  );

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useGuestAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGuestAuth outside GuestAuthProvider");
  return ctx;
}
