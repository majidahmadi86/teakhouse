"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type GuestUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  bookingIds: string[];
};

const SESSION_KEY = "tkh-user";

type GuestAuthCtx = {
  user: GuestUser | null;
  hydrated: boolean;
  /** Returns error key or null on success. */
  signUp: (
    name: string,
    email: string,
    password: string,
    bookingId?: string
  ) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  attachBooking: (bookingId: string, userId?: string) => void;
  updateUser: (patch: Partial<Pick<GuestUser, "name" | "email">>) => void;
};

const Ctx = createContext<GuestAuthCtx | null>(null);

function loadSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveSessionId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sid = loadSessionId();
      if (sid) {
        try {
          const res = await fetch(`/api/users?id=${encodeURIComponent(sid)}`);
          if (res.ok) {
            const u = (await res.json()) as GuestUser;
            if (!cancelled) setUser(u);
          } else {
            saveSessionId(null);
          }
        } catch {
          /* keep null */
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      bookingId?: string
    ): Promise<string | null> => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (!trimmedName || !trimmedEmail || !password) return "missing";

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          name: trimmedName,
          email: trimmedEmail,
          password,
          bookingId,
        }),
      });
      if (res.status === 409) return "exists";
      if (!res.ok) return "missing";
      const u = (await res.json()) as GuestUser;
      setUser(u);
      saveSessionId(u.id);
      return null;
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) return "missing";
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signin",
          email: trimmedEmail,
          password,
        }),
      });
      if (res.status === 401) return "invalid";
      if (!res.ok) return "invalid";
      const u = (await res.json()) as GuestUser;
      setUser(u);
      saveSessionId(u.id);
      return null;
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    saveSessionId(null);
  }, []);

  const attachBooking = useCallback(
    (bookingId: string, userId?: string) => {
      const target = userId ?? user?.id ?? loadSessionId();
      if (!target) return;
      setUser((prev) =>
        prev && prev.id === target && !prev.bookingIds.includes(bookingId)
          ? { ...prev, bookingIds: [...prev.bookingIds, bookingId] }
          : prev
      );
      void fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach",
          userId: target,
          bookingId,
        }),
      });
    },
    [user]
  );

  const updateUser = useCallback(
    (patch: Partial<Pick<GuestUser, "name" | "email">>) => {
      if (!user) return;
      setUser((prev) => (prev ? { ...prev, ...patch } : prev));
      void fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId: user.id,
          patch,
        }),
      });
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      hydrated,
      signUp,
      signIn,
      signOut,
      attachBooking,
      updateUser,
    }),
    [user, hydrated, signUp, signIn, signOut, attachBooking, updateUser]
  );

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useGuestAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGuestAuth outside GuestAuthProvider");
  return ctx;
}
