"use client";

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSeedGuestRooms } from "./guestRooms";
import {
  endOwnerSession,
  ensureOwnerSession,
  ownerFetch,
  startOwnerSession,
} from "./ownerSessionClient";
import { groupRulesByRoom, type PriceRule } from "./pricing";
import { SEED_ROOMS } from "./rooms";
import type {
  Booking,
  BookingInput,
  CellState,
  OwnerData,
  RoomData,
} from "./ownerTypes";
import { isoDate, nightsBetween } from "./utils";

export type {
  Booking,
  BookingInput,
  BookingSource,
  BookingStatus,
  CellState,
  OwnerData,
  RoomData,
} from "./ownerTypes";

const AUTH_KEY = "tkh-owner";

function blockKey(roomSlug: string, dateIso: string): string {
  return `${roomSlug}:${dateIso}`;
}

function emptyData(): OwnerData {
  return {
    rooms: structuredClone(SEED_ROOMS),
    bookings: [],
    blocks: {},
    // Rate rules are seeded relative to seed time, so there is no honest
    // client-side mirror · pre-hydration the base rate is the only truth and
    // every rule-priced surface waits for `hydrated`.
    priceRules: [],
  };
}

function dateOverlapsBooking(dateIso: string, booking: Booking): boolean {
  if (booking.status === "cancelled") return false;
  return dateIso >= booking.checkIn && dateIso < booking.checkOut;
}

function bookingTouchesMonth(booking: Booking, ref: Date): boolean {
  if (booking.status === "cancelled") return false;
  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const inDate = new Date(booking.checkIn + "T12:00:00");
  const outDate = new Date(booking.checkOut + "T12:00:00");
  return inDate <= monthEnd && outDate > monthStart;
}

function computeOccupancyTonight(data: OwnerData): {
  occupied: number;
  total: number;
} {
  const today = isoDate(new Date());
  const activeRooms = data.rooms.filter((r) => r.active);
  const occupiedSlugs = new Set<string>();

  for (const booking of data.bookings) {
    if (booking.status === "cancelled") continue;
    if (dateOverlapsBooking(today, booking)) {
      occupiedSlugs.add(booking.roomSlug);
    }
  }

  return { occupied: occupiedSlugs.size, total: activeRooms.length };
}

function computeArrivalsToday(data: OwnerData): number {
  const today = isoDate(new Date());
  return data.bookings.filter(
    (b) => b.status !== "cancelled" && b.checkIn === today
  ).length;
}

function computeDirectCountMonth(data: OwnerData): number {
  const now = new Date();
  const monthBookings = data.bookings.filter((b) =>
    bookingTouchesMonth(b, now)
  );
  if (monthBookings.length === 0) return 0;
  const direct = monthBookings.filter((b) => b.source === "Direct").length;
  return Math.round((direct / monthBookings.length) * 100);
}

function computeOtaSavedMonth(data: OwnerData): number {
  const now = new Date();
  let total = 0;

  for (const booking of data.bookings) {
    if (booking.source !== "Direct") continue;
    if (!bookingTouchesMonth(booking, now)) continue;

    const room = data.rooms.find((r) => r.slug === booking.roomSlug);
    const nights = nightsBetween(booking.checkIn, booking.checkOut);

    if (room) {
      total += nights * (room.ota - room.rate);
    } else {
      total += Math.round(booking.amount * 0.18);
    }
  }

  return total;
}

/** Where the store is mounted · the owner panel or a guest page. */
export type StoreScope = "owner" | "guest";

/** The guest account id this browser holds (lib/guestAuth), if any. */
function guestSessionId(): string | null {
  try {
    return localStorage.getItem("tkh-user");
  } catch {
    return null;
  }
}

/**
 * v18 · /api/data answers the owner session with every booking and everyone
 * else with the guest view (no personal fields). The owner panel makes sure
 * its session exists before asking; a guest page passes its own account id so
 * /account still lists that guest's bookings.
 */
async function fetchData(scope: StoreScope): Promise<OwnerData> {
  let res: Response;
  if (scope === "owner") {
    await ensureOwnerSession();
    res = await fetch("/api/data", { cache: "no-store" });
  } else {
    const gid = guestSessionId();
    const q = gid ? `?guest=${encodeURIComponent(gid)}` : "";
    res = await fetch(`/api/data${q}`, { cache: "no-store" });
  }
  if (!res.ok) throw new Error("Failed to load data");
  return res.json();
}

/**
 * v18 · Every store write answers with what happened, so a page can confirm
 * only on success and say exactly what went wrong otherwise. Writes are
 * server-first: the page never shows a change the server refused.
 */
export type WriteFailure = {
  ok: false;
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  /** Machine code from the API ("overlap", "unavailable", "slug-taken"...). */
  error: string;
  /** The API's own sentence, when it sent one. */
  message?: string;
  body?: Record<string, unknown>;
};
export type WriteResult<T = null> = { ok: true; data: T } | WriteFailure;

async function readResult<T>(res: Response): Promise<WriteResult<T>> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, data: body as T };
  return {
    ok: false,
    status: res.status,
    error: typeof body.error === "string" ? body.error : "failed",
    message: typeof body.message === "string" ? body.message : undefined,
    body,
  };
}

function networkFailure(): WriteFailure {
  return { ok: false, status: 0, error: "network" };
}

export type CreatedBooking = Booking & { confirmToken?: string; confirmUrl?: string };

export type AddBookingOptions = {
  /** Owner only · save despite a clash the server reported (409). */
  force?: boolean;
  /** Guest only · an offer id from /offers. */
  offer?: string;
  /** The guest's language · the confirmation email follows it. */
  lang?: string;
};

type OwnerCtx = {
  data: OwnerData;
  hydrated: boolean;
  isAuthed: boolean;
  /** Settings → deposit share, 0-100 (30 until the store loads). */
  depositPct: number;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
  resetDemo: () => Promise<"ok" | "rate-limited" | "failed">;
  addBooking: (booking: BookingInput, opts?: AddBookingOptions) => Promise<WriteResult<CreatedBooking>>;
  updateBooking: (
    id: string,
    patch: Partial<Booking>,
    opts?: { force?: boolean }
  ) => Promise<WriteResult<Booking>>;
  cancelGuestBooking: (id: string, guestUserId: string) => void;
  deleteBooking: (id: string) => Promise<WriteResult>;
  addRoom: (room: RoomData) => Promise<WriteResult<RoomData>>;
  updateRoom: (id: string, patch: Partial<RoomData>) => Promise<WriteResult<RoomData>>;
  deleteRoom: (id: string) => Promise<WriteResult>;
  toggleBlock: (roomSlug: string, dateIso: string) => Promise<boolean>;
  addPriceRule: (rule: Omit<PriceRule, "id">) => Promise<void>;
  updatePriceRule: (id: string, patch: Partial<PriceRule>) => Promise<void>;
  deletePriceRule: (id: string) => Promise<void>;
  getCell: (roomSlug: string, dateIso: string) => CellState;
  /** The booking holding a room on a night, if any (the calendar links to it). */
  bookingAt: (roomSlug: string, dateIso: string) => Booking | null;
  occupancyTonight: () => { occupied: number; total: number };
  arrivalsToday: () => number;
  directCountMonth: () => number;
  otaSavedMonth: () => number;
};

const Ctx = createContext<OwnerCtx | null>(null);

export function OwnerProvider({
  children,
  scope = "guest",
}: {
  children: React.ReactNode;
  scope?: StoreScope;
}) {
  const [data, setData] = useState<OwnerData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  // Owner writes carry the owner session; guest writes stay plain fetch.
  const send = useCallback(
    (input: string, init?: RequestInit) =>
      scope === "owner" ? ownerFetch(input, init) : fetch(input, init),
    [scope]
  );

  useEffect(() => {
    let cancelled = false;
    // v14 · start immediately. This used to wait 250ms before even asking for
    // the data, and the shell shows a spinner until it lands, so the delay was
    // pure dead time on every entry into the owner panel.
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const loaded = await fetchData(scope);
          if (!cancelled) {
            startTransition(() => setData(loaded));
          }
        } catch (e) {
          // Falling back to seed data means base rates and no rate rules · that
          // is a visible downgrade, so say so rather than failing silently.
          console.warn("[tkh] live data unavailable, using seed fallback", e);
          if (!cancelled) {
            startTransition(() => setData(emptyData()));
          }
        } finally {
          if (!cancelled) {
            try {
              setIsAuthed(localStorage.getItem(AUTH_KEY) === "1");
            } catch {
              setIsAuthed(false);
            }
            startTransition(() => setHydrated(true));
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [scope]);

  const refresh = useCallback(async () => {
    try {
      const loaded = await fetchData(scope);
      setData(loaded);
    } catch {
      /* keep current */
    }
  }, [scope]);

  // HF-1 · the PIN is checked by the server, which sets the owner session
  // cookie. The localStorage flag only remembers that this tab signed in.
  // v18 · the data loaded before sign-in was the guest view, so reload it.
  const login = useCallback(
    async (email: string, pin: string) => {
      if (!(await startOwnerSession(pin))) return false;
      try {
        localStorage.setItem(AUTH_KEY, "1");
        localStorage.setItem(`${AUTH_KEY}-email`, email);
      } catch {
        /* ignore */
      }
      setIsAuthed(true);
      await refresh();
      return true;
    },
    [refresh]
  );

  const logout = useCallback(() => {
    endOwnerSession();
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(`${AUTH_KEY}-email`);
    } catch {
      /* ignore */
    }
    setIsAuthed(false);
  }, []);

  // HF-1 · needs the owner session, and the server allows one reset per
  // 10 minutes site-wide (429 otherwise) · the shell tells the owner.
  const resetDemo = useCallback(async () => {
    try {
      const res = await ownerFetch("/api/data/reset", { method: "POST" });
      if (res.status === 429) return "rate-limited" as const;
      if (!res.ok) return "failed" as const;
      const loaded = (await res.json()) as OwnerData;
      setData(loaded);
      return "ok" as const;
    } catch {
      return "failed" as const;
    }
  }, []);

  /**
   * v18 · server-first. The booking appears (and a guest sees "Confirmed")
   * only once the server has written it; a clash comes back as 409.
   */
  const addBooking = useCallback(
    async (booking: BookingInput, opts: AddBookingOptions = {}) => {
      try {
        const res = await send("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: "", email: "", notes: "", ...booking, ...opts }),
        });
        const result = await readResult<CreatedBooking>(res);
        if (result.ok) {
          const created = result.data;
          setData((prev) => ({
            ...prev,
            bookings: [created, ...prev.bookings.filter((b) => b.id !== created.id)],
          }));
        }
        return result;
      } catch {
        return networkFailure();
      }
    },
    [send]
  );

  const updateBooking = useCallback(
    async (id: string, patch: Partial<Booking>, opts: { force?: boolean } = {}) => {
      try {
        const res = await ownerFetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts.force ? { ...patch, force: true } : patch),
        });
        const result = await readResult<Booking>(res);
        if (result.ok) {
          const updated = result.data;
          setData((prev) => ({
            ...prev,
            bookings: prev.bookings.map((b) => (b.id === id ? updated : b)),
          }));
        }
        return result;
      } catch {
        return networkFailure();
      }
    },
    []
  );

  /**
   * HF-1 · A guest cancelling a booking on their own account (/account). Not
   * an owner write: the server accepts exactly this change, without an owner
   * session, when the guest account is linked to the booking.
   */
  const cancelGuestBooking = useCallback(
    (id: string, guestUserId: string) => {
      setData((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === id ? { ...b, status: "cancelled" } : b
        ),
      }));
      void (async () => {
        try {
          const res = await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled", guestUserId }),
          });
          if (!res.ok) await refresh();
        } catch {
          await refresh();
        }
      })();
    },
    [refresh]
  );

  const deleteBooking = useCallback(async (id: string) => {
    try {
      const res = await ownerFetch(`/api/bookings/${id}`, { method: "DELETE" });
      const result = await readResult<null>(res);
      if (result.ok) {
        setData((prev) => ({
          ...prev,
          bookings: prev.bookings.filter((b) => b.id !== id),
        }));
      }
      return result;
    } catch {
      return networkFailure();
    }
  }, []);

  const addRoom = useCallback(async (room: RoomData) => {
    try {
      const res = await ownerFetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(room),
      });
      const result = await readResult<RoomData>(res);
      if (result.ok) {
        const created = result.data;
        setData((prev) => ({ ...prev, rooms: [...prev.rooms, created] }));
      }
      return result;
    } catch {
      return networkFailure();
    }
  }, []);

  const updateRoom = useCallback(async (id: string, patch: Partial<RoomData>) => {
    try {
      const res = await ownerFetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = await readResult<RoomData>(res);
      if (result.ok) {
        const updated = result.data;
        setData((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === id ? updated : r)),
        }));
      }
      return result;
    } catch {
      return networkFailure();
    }
  }, []);

  /** v18 · refused (409 "has-bookings") while the room has any booking. */
  const deleteRoom = useCallback(async (id: string) => {
    try {
      const res = await ownerFetch(`/api/rooms/${id}`, { method: "DELETE" });
      const result = await readResult<null>(res);
      if (result.ok) {
        setData((prev) => ({
          ...prev,
          rooms: prev.rooms.filter((r) => r.id !== id),
          priceRules: prev.priceRules.filter((r) => r.roomId !== id),
        }));
      }
      return result;
    } catch {
      return networkFailure();
    }
  }, []);

  /** Optimistic (a calendar cell must answer at once), undone on failure. */
  const toggleBlock = useCallback(async (roomSlug: string, dateIso: string) => {
    const key = blockKey(roomSlug, dateIso);
    const flip = (prev: OwnerData): OwnerData => {
      const blocks = { ...prev.blocks };
      if (blocks[key]) delete blocks[key];
      else blocks[key] = true;
      return { ...prev, blocks };
    };
    setData(flip);
    try {
      const res = await ownerFetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomSlug, dateIso }),
      });
      if (res.ok) return true;
    } catch {
      /* undone below */
    }
    setData(flip);
    return false;
  }, []);

  /**
   * Rate rules go to the server first · the row id is the server's to mint, and
   * a stale optimistic id would break the calendar's per-date rule lookup.
   * The list is small (a handful per room) so the round trip is invisible.
   */
  const addPriceRule = useCallback(
    async (rule: Omit<PriceRule, "id">) => {
      const res = await ownerFetch(`/api/rooms/${rule.roomId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not save the rate rule");
      }
      const created = (await res.json()) as PriceRule;
      setData((prev) => ({ ...prev, priceRules: [...prev.priceRules, created] }));
    },
    []
  );

  /** v18 · server-first; throws when the server refuses, so the page can say so. */
  const updatePriceRule = useCallback(
    async (id: string, patch: Partial<PriceRule>) => {
      const rule = data.priceRules.find((r) => r.id === id);
      if (!rule) throw new Error("Rule not found");
      const res = await ownerFetch(`/api/rooms/${rule.roomId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not save the rate rule");
      }
      const saved = (await res.json().catch(() => null)) as PriceRule | null;
      setData((prev) => ({
        ...prev,
        priceRules: prev.priceRules.map((r) =>
          r.id === id ? (saved && saved.id ? saved : { ...r, ...patch }) : r
        ),
      }));
    },
    [data.priceRules]
  );

  const deletePriceRule = useCallback(
    async (id: string) => {
      const rule = data.priceRules.find((r) => r.id === id);
      if (!rule) return;
      const res = await ownerFetch(
        `/api/rooms/${rule.roomId}/pricing?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Could not delete the rate rule");
      setData((prev) => ({
        ...prev,
        priceRules: prev.priceRules.filter((r) => r.id !== id),
      }));
    },
    [data.priceRules]
  );

  const depositPct = data.depositPct ?? 30;

  const getCell = useCallback(
    (roomSlug: string, dateIso: string): CellState => {
      if (data.blocks[blockKey(roomSlug, dateIso)]) return "blocked";
      const booked = data.bookings.some(
        (b) => b.roomSlug === roomSlug && dateOverlapsBooking(dateIso, b)
      );
      return booked ? "booked" : "available";
    },
    [data]
  );

  const bookingAt = useCallback(
    (roomSlug: string, dateIso: string): Booking | null =>
      data.bookings.find(
        (b) => b.roomSlug === roomSlug && dateOverlapsBooking(dateIso, b)
      ) ?? null,
    [data.bookings]
  );

  const occupancyTonight = useCallback(
    () => computeOccupancyTonight(data),
    [data]
  );
  const arrivalsToday = useCallback(() => computeArrivalsToday(data), [data]);
  const directCountMonth = useCallback(
    () => computeDirectCountMonth(data),
    [data]
  );
  const otaSavedMonth = useCallback(() => computeOtaSavedMonth(data), [data]);

  const value = useMemo<OwnerCtx>(
    () => ({
      data,
      hydrated,
      isAuthed,
      depositPct,
      login,
      logout,
      refresh,
      resetDemo,
      addBooking,
      updateBooking,
      cancelGuestBooking,
      deleteBooking,
      addRoom,
      updateRoom,
      deleteRoom,
      toggleBlock,
      addPriceRule,
      updatePriceRule,
      deletePriceRule,
      getCell,
      bookingAt,
      occupancyTonight,
      arrivalsToday,
      directCountMonth,
      otaSavedMonth,
    }),
    [
      data,
      hydrated,
      isAuthed,
      depositPct,
      login,
      logout,
      refresh,
      resetDemo,
      addBooking,
      updateBooking,
      cancelGuestBooking,
      deleteBooking,
      addRoom,
      updateRoom,
      deleteRoom,
      toggleBlock,
      addPriceRule,
      updatePriceRule,
      deletePriceRule,
      getCell,
      bookingAt,
      occupancyTonight,
      arrivalsToday,
      directCountMonth,
      otaSavedMonth,
    ]
  );

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useOwner() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOwner outside OwnerProvider");
  return ctx;
}

/**
 * Active rooms for the guest side.
 *
 * Memoized on purpose. /book lists these and keys an effect off the array, so
 * handing back a new array every render re-ran that effect, which set state,
 * which re-rendered, forever. A render loop at default priority also starves
 * the store's own startTransition updates · the symptom was a page that fetched
 * live rooms and rate rules successfully and then never showed them, quietly
 * pricing every stay at the base rate.
 */
export function useGuestRooms(): RoomData[] {
  const ctx = useContext(Ctx);
  const rooms = ctx?.hydrated ? ctx.data.rooms : null;
  return useMemo(
    () => (rooms ? rooms.filter((r) => r.active) : getSeedGuestRooms()),
    [rooms]
  );
}

const NO_RULES: PriceRule[] = [];

/**
 * Live rate rules for the guest side. Empty until the store hydrates, which is
 * deliberate: the pre-hydration shell prices nights at the base rate and every
 * rule-priced surface (calendar day prices, stay breakdown) stays quiet until
 * the real rules land, so the shell never shows a price it has to take back.
 */
export function useGuestPriceRules(): PriceRule[] {
  const ctx = useContext(Ctx);
  return ctx?.hydrated ? ctx.data.priceRules : NO_RULES;
}

/** Rate rules indexed by roomId · the shape the pricing engine consumes. */
export function useGuestPriceRulesByRoom(): Record<string, PriceRule[]> {
  const rules = useGuestPriceRules();
  return useMemo(() => groupRulesByRoom(rules), [rules]);
}
