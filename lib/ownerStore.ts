"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SEED_BOOKINGS } from "./seedBookings";
import { SEED_ROOMS } from "./rooms";
import { isoDate, nightsBetween } from "./utils";

export type BookingStatus = "in" | "ok" | "out" | "cancelled";
export type BookingSource = "Direct" | "Agoda" | "Booking";
export type Booking = {
  id: string;
  code: string;
  guest: string;
  phone: string;
  email: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  source: BookingSource;
  amount: number;
  status: BookingStatus;
  notes: string;
  passportId?: string;
  nationality?: string;
  adults?: number;
  children?: number;
  arrivalTime?: string;
  specialRequests?: string;
};

export type BookingInput = Partial<Booking> &
  Pick<
    Booking,
    | "id"
    | "code"
    | "guest"
    | "roomSlug"
    | "checkIn"
    | "checkOut"
    | "source"
    | "amount"
    | "status"
  > & {
    phone?: string;
    email?: string;
    notes?: string;
  };
export type RoomData = import("./rooms").Room;
export type CellState = "available" | "booked" | "blocked";
export type OwnerData = {
  rooms: RoomData[];
  bookings: Booking[];
  /** key: `${roomSlug}:${yyyy-mm-dd}` -> blocked only (booked derived) */
  blocks: Record<string, true>;
  /** Bump when seed room photos/content must refresh stored demos */
  seedVersion?: number;
};

const STORAGE_KEY = "tkh-data";
const AUTH_KEY = "tkh-owner";
/** v8: Teak Suite photo IDs were 404; refresh seed photos into stored rooms */
const SEED_VERSION = 8;

function blockKey(roomSlug: string, dateIso: string): string {
  return `${roomSlug}:${dateIso}`;
}

function seedData(): OwnerData {
  return {
    rooms: structuredClone(SEED_ROOMS),
    bookings: structuredClone(SEED_BOOKINGS) as Booking[],
    blocks: {},
    seedVersion: SEED_VERSION,
  };
}

function syncSeedPhotos(data: OwnerData): OwnerData {
  if ((data.seedVersion ?? 0) >= SEED_VERSION) return data;
  const rooms = data.rooms.map((room) => {
    const seed = SEED_ROOMS.find((s) => s.id === room.id);
    if (!seed) return room;
    return { ...room, photos: [...seed.photos] };
  });
  return { ...data, rooms, seedVersion: SEED_VERSION };
}

function loadStored(): OwnerData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OwnerData;
    if (!parsed.rooms || !parsed.bookings || !parsed.blocks) return null;
    return syncSeedPhotos(parsed);
  } catch {
    return null;
  }
}

function persist(data: OwnerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors in demo */
  }
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

function computeOccupancyTonight(data: OwnerData): { occupied: number; total: number } {
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
  const monthBookings = data.bookings.filter((b) => bookingTouchesMonth(b, now));
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
  const [data, setData] = useState<OwnerData>(seedData);
  const [hydrated, setHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    setData(stored ?? seedData());
    try {
      setIsAuthed(localStorage.getItem(AUTH_KEY) === "1");
    } catch {
      setIsAuthed(false);
    }
    setHydrated(true);
  }, []);

  const commit = useCallback(
    (next: OwnerData | ((prev: OwnerData) => OwnerData)) => {
      setData((prev) => {
        const updated = typeof next === "function" ? next(prev) : next;
        if (hydrated) persist(updated);
        return updated;
      });
    },
    [hydrated]
  );

  useEffect(() => {
    if (hydrated) persist(data);
  }, [data, hydrated]);

  const login = useCallback((email: string, pin: string) => {
    if (pin !== "1234") return false;
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
    const fresh = seedData();
    commit(fresh);
  }, [commit]);

  const addBooking = useCallback(
    (booking: BookingInput) => {
      const full: Booking = {
        phone: "",
        email: "",
        notes: "",
        ...booking,
      };
      commit((prev) => ({
        ...prev,
        bookings: [...prev.bookings, full],
      }));
    },
    [commit]
  );

  const updateBooking = useCallback(
    (id: string, patch: Partial<Booking>) => {
      commit((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === id ? { ...b, ...patch } : b
        ),
      }));
    },
    [commit]
  );

  const deleteBooking = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== id),
      }));
    },
    [commit]
  );

  const addRoom = useCallback(
    (room: RoomData) => {
      commit((prev) => ({
        ...prev,
        rooms: [...prev.rooms, room],
      }));
    },
    [commit]
  );

  const updateRoom = useCallback(
    (id: string, patch: Partial<RoomData>) => {
      commit((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
    },
    [commit]
  );

  const deleteRoom = useCallback(
    (id: string) => {
      commit((prev) => {
        const room = prev.rooms.find((r) => r.id === id);
        if (!room) return prev;
        return {
          ...prev,
          rooms: prev.rooms.filter((r) => r.id !== id),
          bookings: prev.bookings.filter((b) => b.roomSlug !== room.slug),
        };
      });
    },
    [commit]
  );

  const toggleBlock = useCallback(
    (roomSlug: string, dateIso: string) => {
      const key = blockKey(roomSlug, dateIso);
      commit((prev) => {
        const blocks = { ...prev.blocks };
        if (blocks[key]) {
          delete blocks[key];
        } else {
          blocks[key] = true;
        }
        return { ...prev, blocks };
      });
    },
    [commit]
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
  return SEED_ROOMS.filter((r) => r.active);
}
