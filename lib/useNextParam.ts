"use client";

import { useEffect, useState } from "react";

/**
 * Sign-in and sign-up read where to go next (?next=) and which booking to
 * attach (?booking=) from the address after hydration. Only a same-site path
 * is accepted for next, so the form can never be turned into an open redirect.
 */
export function useNextParam(): { next: string; bookingId?: string } {
  const [state, setState] = useState<{ next: string; bookingId?: string }>({ next: "/account" });
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const n = p.get("next");
    setState({
      next: n && n.startsWith("/") && !n.startsWith("//") ? n : "/account",
      bookingId: p.get("booking") || undefined,
    });
  }, []);
  return state;
}
