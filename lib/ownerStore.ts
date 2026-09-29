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

async function fetchData(): Promise<OwnerData> {
  const res = await fetch("/api/data", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data");
  return res.json();
}

type OwnerCtx = {
  data: OwnerData;
  hydrated: boolean;
  isAuthed: boolean;
  login: (email: string, pin: string) => boolean;
  logout: () => void;
  resetDemo: () => void;
  addBooking: (booking: BookingInput) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  addRoom: (room: RoomData) => void;
  updateRoom: (id: string, patch: Partial<RoomData>) => void;
  deleteRoom: (id: string) => void;
  toggleBlock: (roomSlug: string, dateIso: string) => void;
  addPriceRule: (rule: Omit<PriceRule, "id">) => Promise<void>;
  updatePriceRule: (id: string, patch: Partial<PriceRule>) => Promise<void>;
  deletePriceRule: (id: string) => Promise<void>;
  getCell: (roomSlug: string, dateIso: string) => CellState;
  occupancyTonight: () => { occupied: number; total: number };
  arrivalsToday: () => number;
  directCountMonth: () => number;
  otaSavedMonth: () => number;
};

const Ctx = createContext<OwnerCtx | null>(null);

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OwnerData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // v14 · start immediately. This used to wait 250ms before even asking for
    // the data, and the shell shows a spinner until it lands, so the delay was
    // pure dead time on every entry into the owner panel.
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const loaded = await fetchData();
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
  }, []);

  const refresh = useCallback(async () => {
    try {
      const loaded = await fetchData();
      setData(loaded);
    } catch {
      /* keep current */
    }
  }, []);

  const login = useCallback((email: string, pin: string) => {
    const expected = process.env.NEXT_PUBLIC_OWNER_PIN ?? "1234";
    if (pin !== expected) return false;
    try {
      localStorage.setItem(AUTH_KEY, "1");
      localStorage.setItem(`${AUTH_KEY}-email`, email);
    } catch {
      /* ignore */
    }
    setIsAuthed(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(`${AUTH_KEY}-email`);
    } catch {
      /* ignore */
    }
    setIsAuthed(false);
  }, []);

  const resetDemo = useCallback(() => {
    void (async () => {
      const res = await fetch("/api/data/reset", { method: "POST" });
      if (res.ok) {
        const loaded = (await res.json()) as OwnerData;
        setData(loaded);
      }
    })();
  }, []);

  const addBooking = useCallback((booking: BookingInput) => {
    const full: Booking = {
      phone: "",
      email: "",
      notes: "",
      ...booking,
    };
    setData((prev) => ({
      ...prev,
      bookings: [...prev.bookings, full],
    }));
    void (async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(full),
      });
      if (!res.ok) await refresh();
    })();
  }, [refresh]);

  const updateBooking = useCallback(
    (id: string, patch: Partial<Booking>) => {
      setData((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === id ? { ...b, ...patch } : b
        ),
      }));
      void (async () => {
        const res = await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) await refresh();
      })();
    },
    [refresh]
  );

  const deleteBooking = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== id),
      }));
      void (async () => {
        const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
        if (!res.ok) await refresh();
      })();
    },
    [refresh]
  );

  const addRoom = useCallback(
    (room: RoomData) => {
      setData((prev) => ({
        ...prev,
        rooms: [...prev.rooms, room],
      }));
      void (async () => {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(room),
        });
        if (!res.ok) await refresh();
      })();
    },
    [refresh]
  );

  const updateRoom = useCallback(
    (id: string, patch: Partial<RoomData>) => {
      setData((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
      void (async () => {
        const res = await fetch(`/api/rooms/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) await refresh();
      })();
    },
    [refresh]
  );

  const deleteRoom = useCallback(
    (id: string) => {
      setData((prev) => {
        const room = prev.rooms.find((r) => r.id === id);
        if (!room) return prev;
        return {
          ...prev,
          rooms: prev.rooms.filter((r) => r.id !== id),
          bookings: prev.bookings.filter((b) => b.roomSlug !== room.slug),
        };
      });
      void (async () => {
        const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
        if (!res.ok) await refresh();
      })();
    },
    [refresh]
  );

  const toggleBlock = useCallback(
    (roomSlug: string, dateIso: string) => {
      const key = blockKey(roomSlug, dateIso);
      setData((prev) => {
        const blocks = { ...prev.blocks };
        if (blocks[key]) delete blocks[key];
        else blocks[key] = true;
        return { ...prev, blocks };
      });
      void (async () => {
        const res = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomSlug, dateIso }),
        });
        if (!res.ok) await refresh();
      })();
    },
    [refresh]
  );

  /**
   * Rate rules go to the server first · the row id is the server's to mint, and
   * a stale optimistic id would break the calendar's per-date rule lookup.
   * The list is small (a handful per room) so the round trip is invisible.
   */
  const addPriceRule = useCallback(
    async (rule: Omit<PriceRule, "id">) => {
      const res = await fetch(`/api/rooms/${rule.roomId}/pricing`, {
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

  const updatePriceRule = useCallback(
    async (id: string, patch: Partial<PriceRule>) => {
      const rule = data.priceRules.find((r) => r.id === id);
      if (!rule) return;
      setData((prev) => ({
        ...prev,
        priceRules: prev.priceRules.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      }));
      const res = await fetch(`/api/rooms/${rule.roomId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, id }),
      });
      if (!res.ok) await refresh();
    },
    [data.priceRules, refresh]
  );

  const deletePriceRule = useCallback(
    async (id: string) => {
      const rule = data.priceRules.find((r) => r.id === id);
      if (!rule) return;
      setData((prev) => ({
        ...prev,
        priceRules: prev.priceRules.filter((r) => r.id !== id),
      }));
      const res = await fetch(
        `/api/rooms/${rule.roomId}/pricing?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) await refresh();
    },
    [data.priceRules, refresh]
  );

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
      login,
      logout,
      resetDemo,
      addBooking,
      updateBooking,
      deleteBooking,
      addRoom,
      updateRoom,
      deleteRoom,
      toggleBlock,
      addPriceRule,
      updatePriceRule,
      deletePriceRule,
      getCell,
      occupancyTonight,
      arrivalsToday,
      directCountMonth,
      otaSavedMonth,
    }),
    [
      data,
      hydrated,
      isAuthed,
      login,
      logout,
      resetDemo,
      addBooking,
      updateBooking,
      deleteBooking,
      addRoom,
      updateRoom,
      deleteRoom,
      toggleBlock,
      addPriceRule,
      updatePriceRule,
      deletePriceRule,
      getCell,
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
