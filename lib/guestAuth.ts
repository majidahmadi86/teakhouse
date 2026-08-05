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
  password: string;
  bookingIds: string[];
};

const USERS_KEY = "tkh-users";
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
  ) => string | null;
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
  attachBooking: (bookingId: string, userId?: string) => void;
  updateUser: (patch: Partial<Pick<GuestUser, "name" | "email">>) => void;
};

const Ctx = createContext<GuestAuthCtx | null>(null);

function loadUsers(): GuestUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: GuestUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

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
  const [users, setUsers] = useState<GuestUser[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadUsers();
    setUsers(loaded);
    const sid = loadSessionId();
    if (sid && loaded.some((u) => u.id === sid)) setSessionId(sid);
    setHydrated(true);
  }, []);

  const persistUsers = useCallback((next: GuestUser[]) => {
    setUsers(next);
    saveUsers(next);
  }, []);

  const user = useMemo(
    () => users.find((u) => u.id === sessionId) ?? null,
    [users, sessionId]
  );

  const signUp = useCallback(
    (
      name: string,
      email: string,
      password: string,
      bookingId?: string
    ): string | null => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (!trimmedName || !trimmedEmail || !password) {
        return "missing";
      }
      if (users.some((u) => u.email === trimmedEmail)) {
        return "exists";
      }
      const next: GuestUser = {
        id: `gu-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        password,
        bookingIds: bookingId ? [bookingId] : [],
      };
      persistUsers([...users, next]);
      setSessionId(next.id);
      saveSessionId(next.id);
      return null;
    },
    [users, persistUsers]
  );

  const signIn = useCallback(
    (email: string, password: string): string | null => {
      const trimmedEmail = email.trim().toLowerCase();
      const found = users.find(
        (u) => u.email === trimmedEmail && u.password === password
      );
      if (!found) return "invalid";
      setSessionId(found.id);
      saveSessionId(found.id);
      return null;
    },
    [users]
  );

  const signOut = useCallback(() => {
    setSessionId(null);
    saveSessionId(null);
  }, []);

  const attachBooking = useCallback(
    (bookingId: string, userId?: string) => {
      const target = userId ?? sessionId ?? loadSessionId();
      if (!target) return;
      persistUsers(
        users.map((u) =>
          u.id === target && !u.bookingIds.includes(bookingId)
            ? { ...u, bookingIds: [...u.bookingIds, bookingId] }
            : u
        )
      );
    },
    [sessionId, users, persistUsers]
  );

  const updateUser = useCallback(
    (patch: Partial<Pick<GuestUser, "name" | "email">>) => {
      if (!sessionId) return;
      persistUsers(
        users.map((u) => {
          if (u.id !== sessionId) return u;
          const next = { ...u, ...patch };
          if (patch.email) next.email = patch.email.trim().toLowerCase();
          if (patch.name) next.name = patch.name.trim();
          return next;
        })
      );
    },
    [sessionId, users, persistUsers]
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
