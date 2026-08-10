import type { AmenityId } from "./amenities";
import type { Room, RoomShortKey } from "./rooms";
import type {
  Booking,
  BookingSource,
  BookingStatus,
  OwnerData,
} from "./ownerTypes";

export type {
  Booking,
  BookingInput,
  BookingSource,
  BookingStatus,
  CellState,
  OwnerData,
  RoomData,
} from "./ownerTypes";

export type DbRoom = {
  id: string;
  slug: string;
  shortKey: string;
  nameEn: string;
  nameTh: string;
  rate: number;
  ota: number;
  metaEn: string;
  metaTh: string;
  descriptionEn: string;
  descriptionTh: string;
  photos: string;
  amenities: string;
  capacity: number;
  bedTypeEn: string;
  bedTypeTh: string;
  sizeM2: number;
  viewEn: string;
  viewTh: string;
  floorEn: string;
  floorTh: string;
  bathtub: boolean;
  balcony: boolean;
  pets: boolean;
  active: boolean;
  urgencyEn: string | null;
  urgencyTh: string | null;
};

export type DbBooking = {
  id: string;
  code: string;
  guest: string;
  phone: string;
  email: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  source: string;
  amount: number;
  status: string;
  notes: string;
  passportId: string | null;
  nationality: string | null;
  adults: number | null;
  children: number | null;
  arrivalTime: string | null;
  specialRequests: string | null;
};

export function roomToClient(r: DbRoom): Room {
  const photos = JSON.parse(r.photos) as string[];
  const amenities = JSON.parse(r.amenities) as AmenityId[];
  return {
    id: r.id,
    slug: r.slug,
    shortKey: r.shortKey as RoomShortKey,
    name: { en: r.nameEn, th: r.nameTh },
    rate: r.rate,
    ota: r.ota,
    meta: { en: r.metaEn, th: r.metaTh },
    description: { en: r.descriptionEn, th: r.descriptionTh },
    photos,
    amenities,
    capacity: r.capacity,
    bedType: { en: r.bedTypeEn, th: r.bedTypeTh },
    sizeM2: r.sizeM2,
    view: { en: r.viewEn, th: r.viewTh },
    floor: { en: r.floorEn, th: r.floorTh },
    bathtub: r.bathtub,
    balcony: r.balcony,
    pets: r.pets,
    active: r.active,
    urgency:
      r.urgencyEn || r.urgencyTh
        ? { en: r.urgencyEn ?? "", th: r.urgencyTh ?? "" }
        : undefined,
  };
}

export function roomToDb(room: Room) {
  return {
    id: room.id,
    slug: room.slug,
    shortKey: room.shortKey,
    nameEn: room.name.en,
    nameTh: room.name.th,
    rate: room.rate,
    ota: room.ota,
    metaEn: room.meta.en,
    metaTh: room.meta.th,
    descriptionEn: room.description.en,
    descriptionTh: room.description.th,
    photos: JSON.stringify(room.photos),
    amenities: JSON.stringify(room.amenities),
    capacity: room.capacity,
    bedTypeEn: room.bedType.en,
    bedTypeTh: room.bedType.th,
    sizeM2: room.sizeM2,
    viewEn: room.view.en,
    viewTh: room.view.th,
    floorEn: room.floor.en,
    floorTh: room.floor.th,
    bathtub: room.bathtub,
    balcony: room.balcony,
    pets: room.pets,
    active: room.active,
    urgencyEn: room.urgency?.en ?? null,
    urgencyTh: room.urgency?.th ?? null,
  };
}

export function bookingToClient(b: DbBooking): Booking {
  return {
    id: b.id,
    code: b.code,
    guest: b.guest,
    phone: b.phone,
    email: b.email,
    roomSlug: b.roomSlug,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    source: b.source as BookingSource,
    amount: b.amount,
    status: b.status as BookingStatus,
    notes: b.notes,
    passportId: b.passportId ?? undefined,
    nationality: b.nationality ?? undefined,
    adults: b.adults ?? undefined,
    children: b.children ?? undefined,
    arrivalTime: b.arrivalTime ?? undefined,
    specialRequests: b.specialRequests ?? undefined,
  };
}

export function bookingToDb(b: Booking) {
  return {
    id: b.id,
    code: b.code,
    guest: b.guest,
    phone: b.phone ?? "",
    email: b.email ?? "",
    roomSlug: b.roomSlug,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    source: b.source,
    amount: b.amount,
    status: b.status,
    notes: b.notes ?? "",
    passportId: b.passportId ?? null,
    nationality: b.nationality ?? null,
    adults: b.adults ?? null,
    children: b.children ?? null,
    arrivalTime: b.arrivalTime ?? null,
    specialRequests: b.specialRequests ?? null,
  };
}

export function blocksToRecord(
  rows: { room: { slug: string }; dateIso: string }[]
): Record<string, true> {
  const out: Record<string, true> = {};
  for (const row of rows) {
    out[`${row.room.slug}:${row.dateIso}`] = true;
  }
  return out;
}

export function emptyOwnerData(): OwnerData {
  return { rooms: [], bookings: [], blocks: {} };
}
