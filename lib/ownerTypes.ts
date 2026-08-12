import type { PriceRule } from "./pricing";
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
  /** Per-day rate rules, all rooms · the booking engine prices nights from these. */
  priceRules: PriceRule[];
  seedVersion?: number;
};

export type HotelDto = {
  id: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  lineId: string;
  address: string;
  addressLine: string;
  city: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
  checkInTime: string;
  checkOutTime: string;
  cancelPolicy: string;
  petsPolicy: string;
  depositPct: number;
};

/** Wire shape of a per-day rate rule · identical to lib/pricing PriceRule. */
export type SeasonalPriceRuleDto = PriceRule;

export type EmailTemplateDto = {
  id: string;
  hotelId: string;
  key: string;
  subject: string;
  body: string;
};
