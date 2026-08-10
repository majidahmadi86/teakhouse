import type { Room } from "./rooms";

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

export type RoomData = Room;
export type CellState = "available" | "booked" | "blocked";

export type OwnerData = {
  rooms: RoomData[];
  bookings: Booking[];
  /** key: `${roomSlug}:${yyyy-mm-dd}` -> blocked only (booked derived) */
  blocks: Record<string, true>;
  seedVersion?: number;
};
