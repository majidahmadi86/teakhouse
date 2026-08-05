export type BookingSource = "Direct" | "Agoda" | "Booking";

export type BookingStatus = "in" | "ok" | "out";

export type SeedBooking = {
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
};

const ROOM_NAME_TO_SLUG: Record<string, string> = {
  "River Loft": "river-loft",
  "Teak Suite": "teak-suite",
  "Garden Room": "garden-room",
  "Courtyard Twin": "courtyard-twin",
};

function toIso(mmdd: string, year = 2026): string {
  const [month, day] = mmdd.split("-");
  return `${year}-${month}-${day}`;
}

export const SEED_BOOKINGS: SeedBooking[] = [
  {
    id: "bk-4271",
    code: "TKH-4271",
    guest: "Claire Dubois",
    phone: "+33 6 12 34 56 78",
    email: "claire.dubois@email.com",
    roomSlug: ROOM_NAME_TO_SLUG["River Loft"],
    checkIn: toIso("08-05"),
    checkOut: toIso("08-08"),
    source: "Direct",
    amount: 11700,
    status: "in",
    notes: "Late arrival after 22:00, river view requested.",
  },
  {
    id: "bk-4270",
    code: "TKH-4270",
    guest: "ปริม วัฒนกุล",
    phone: "+66 81 234 5678",
    email: "prima.w@email.co.th",
    roomSlug: ROOM_NAME_TO_SLUG["Teak Suite"],
    checkIn: toIso("08-05"),
    checkOut: toIso("08-07"),
    source: "Direct",
    amount: 6400,
    status: "in",
    notes: "Anniversary stay, bathtub flowers.",
  },
  {
    id: "bk-4269",
    code: "TKH-4269",
    guest: "Daniel Meier",
    phone: "+49 170 1234567",
    email: "daniel.meier@email.de",
    roomSlug: ROOM_NAME_TO_SLUG["Garden Room"],
    checkIn: toIso("08-04"),
    checkOut: toIso("08-09"),
    source: "Direct",
    amount: 12000,
    status: "ok",
    notes: "Pool-side breakfast preference.",
  },
  {
    id: "bk-4268-agd",
    code: "AGD-88213",
    guest: "Yuki Tanaka",
    phone: "+81 90 1234 5678",
    email: "yuki.tanaka@email.jp",
    roomSlug: ROOM_NAME_TO_SLUG["Courtyard Twin"],
    checkIn: toIso("08-04"),
    checkOut: toIso("08-06"),
    source: "Agoda",
    amount: 5100,
    status: "ok",
    notes: "OTA prepaid, twin beds confirmed.",
  },
  {
    id: "bk-4268",
    code: "TKH-4268",
    guest: "Tom & Sarah Ellis",
    phone: "+44 7700 900123",
    email: "ellis.family@email.co.uk",
    roomSlug: ROOM_NAME_TO_SLUG["River Loft"],
    checkIn: toIso("08-09"),
    checkOut: toIso("08-12"),
    source: "Direct",
    amount: 11700,
    status: "ok",
    notes: "Honeymoon, balcony champagne on arrival.",
  },
  {
    id: "bk-55102",
    code: "BKG-55102",
    guest: "Marco Rossi",
    phone: "+39 333 1234567",
    email: "marco.rossi@email.it",
    roomSlug: ROOM_NAME_TO_SLUG["Garden Room"],
    checkIn: toIso("08-10"),
    checkOut: toIso("08-13"),
    source: "Booking",
    amount: 8700,
    status: "ok",
    notes: "Booking.com virtual card on file.",
  },
  {
    id: "bk-4267",
    code: "TKH-4267",
    guest: "อานนท์ ศรีสุข",
    phone: "+66 89 876 5432",
    email: "anont.s@email.co.th",
    roomSlug: ROOM_NAME_TO_SLUG["Teak Suite"],
    checkIn: toIso("08-11"),
    checkOut: toIso("08-14"),
    source: "Direct",
    amount: 9600,
    status: "ok",
    notes: "Business stay, early check-in requested.",
  },
  {
    id: "bk-4266",
    code: "TKH-4266",
    guest: "Emma Laurent",
    phone: "+33 6 98 76 54 32",
    email: "emma.laurent@email.fr",
    roomSlug: ROOM_NAME_TO_SLUG["Courtyard Twin"],
    checkIn: toIso("08-02"),
    checkOut: toIso("08-05"),
    source: "Direct",
    amount: 6300,
    status: "out",
    notes: "Checked out on time, left positive review.",
  },
  {
    id: "bk-4265",
    code: "TKH-4265",
    guest: "James Whitfield",
    phone: "+1 415 555 0198",
    email: "j.whitfield@email.com",
    roomSlug: ROOM_NAME_TO_SLUG["River Loft"],
    checkIn: toIso("07-30"),
    checkOut: toIso("08-03"),
    source: "Direct",
    amount: 15600,
    status: "out",
    notes: "Extended stay, airport transfer booked.",
  },
  {
    id: "bk-4264-agd",
    code: "AGD-87954",
    guest: "Li Wei",
    phone: "+86 138 0013 8000",
    email: "li.wei@email.cn",
    roomSlug: ROOM_NAME_TO_SLUG["Garden Room"],
    checkIn: toIso("07-29"),
    checkOut: toIso("08-02"),
    source: "Agoda",
    amount: 11600,
    status: "out",
    notes: "Pet fee collected at check-in.",
  },
];
