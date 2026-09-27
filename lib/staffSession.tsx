"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { can as canRole, homeFor, isRole, type Permission, type Role } from "@/lib/auth/rbac";

/**
 * v15 · Who is using the owner panel · from the server session, never from
 * localStorage. The sandbox actor (DEMO_MODE, no sign-in) is an owner, and
 * the role switcher creates real sessions so the demo can show every view.
 */

export type StaffMe = {
  signedIn: boolean;
  sandbox: boolean;
  demo: boolean;
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
};

type StaffCtx = {
  me: StaffMe | null;
  loading: boolean;
  /** true when the panel must show the sign-in screen */
  needsLogin: boolean;
  can: (permission: Permission) => boolean;
  role: Role | null;
  home: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<StaffCtx | null>(null);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<StaffMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/staff", { cache: "no-store", credentials: "same-origin" });
      if (res.ok) {
        const data = (await res.json()) as StaffMe;
        if (isRole(data.role)) {
          setMe(data);
          setNeedsLogin(false);
          return;
        }
      }
      setMe(null);
      setNeedsLogin(true);
    } catch {
      setMe(null);
      setNeedsLogin(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      if (!res.ok) return false;
      await refresh();
      return true;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    await refresh();
  }, [refresh]);

  const switchRole = useCallback(
    async (role: Role) => {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", role }),
      });
      if (!res.ok) return false;
      await refresh();
      return true;
    },
    [refresh]
  );

  const value = useMemo<StaffCtx>(
    () => ({
      me,
      loading,
      needsLogin,
      role: me?.role ?? null,
      can: (p) => canRole(me?.role, p),
      home: me ? homeFor(me.role) : "/owner",
      login,
      logout,
      switchRole,
      refresh,
    }),
    [me, loading, needsLogin, login, logout, switchRole, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStaff() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStaff outside StaffProvider");
  return ctx;
}
