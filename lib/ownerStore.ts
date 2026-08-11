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
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const loaded = await fetchData();
          if (!cancelled) {
            startTransition(() => setData(loaded));
          }
        } catch {
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
    }, 250);
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

export function useGuestRooms(): RoomData[] {
  const ctx = useContext(Ctx);
  if (ctx?.hydrated) {
    return ctx.data.rooms.filter((r) => r.active);
  }
  return getSeedGuestRooms();
}
