import type { PriceRule } from "./pricing";
import type { Room } from "./rooms";

export type BookingStatus = "in" | "ok" | "out" | "cancelled";
export type BookingSource = "Direct" | "Agoda" | "Booking" | (string & {});

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
  /** v15 · money, packages, channel provenance, lifecycle stamps */
  currency?: string;
  fxRate?: number;
  paidAmount?: number;
  paymentStatus?: "unpaid" | "deposit" | "paid" | "refunded" | "pending_wire";
  packages?: { key: string; qty: number }[];
  packagesAmount?: number;
  channelId?: string | null;
  externalRef?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  /** true when identity fields are sealed in the vault (reveal via /identity) */
  vaulted?: boolean;
  createdAt?: string;
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
  /** v15 · published packages · guest scope only */
  addons?: import("./addons").Addon[];
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
  /** v13 · table reservations */
  reservationsEnabled: boolean;
  serviceStart: string;
  serviceEnd: string;
  maxPartySize: number;
  /** v13 · uploaded page heroes · empty means the seeded local image */
  diningHeroImage: string;
  eventsHeroImage: string;
  /** v15 · localisation + money rails */
  timeZone: string;
  baseCurrency: string;
  promptPayId: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankSwift: string;
  /** true when GUEST_VAULT_KEY is set on the server */
  vaultEnabled: boolean;
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
