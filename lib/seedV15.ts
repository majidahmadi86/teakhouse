import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { storeSecret } from "@/lib/channels/registry";
import { addDaysIso } from "@/lib/pricing";

/**
 * v15 · Seed for the Eight-Star tables · called from seedDatabase() so the
 * hourly demo reset produces staff, packages, yield rules, channels, payments,
 * service requests and a preference log every time.
 *
 * Staff passwords: owner uses OWNER_PIN (default 1234) so the old PIN still
 * opens the panel; every other role uses "teak" + role for the sandbox.
 */

/** Physical units per seeded room type · 12 units across 10 types, as the hero says. */
export const SEED_UNITS: Record<string, number> = {
  "river-loft": 2,
  "garden-room": 2,
};

export const SEED_HK: Record<string, string> = {
  "river-loft": "inspected",
  "teak-suite": "dirty",
  "garden-room": "clean",
  "courtyard-twin": "dirty",
  "pier-studio": "clean",
  "mango-corner": "ooo",
};

export const SEED_STAFF = [
  { email: "owner@teakhouse.demo", name: "Pim Vorasingha", role: "owner" },
  { email: "manager@teakhouse.demo", name: "Daniel Hoare", role: "manager" },
  { email: "desk@teakhouse.demo", name: "Nok Srisuk", role: "frontdesk" },
  { email: "housekeeping@teakhouse.demo", name: "Aom Chaiyo", role: "housekeeping" },
] as const;

export function seedStaffPassword(role: string): string {
  if (role === "owner") return process.env.OWNER_PIN?.trim() || "1234";
  return `teak${role}`;
}

const ADDONS = [
  {
    key: "helicopter-transfer",
    nameEn: "Helicopter transfer",
    nameTh: "รถรับส่งเฮลิคอปเตอร์",
    descriptionEn: "Suvarnabhumi to our river helipad in 18 minutes. Two guests, luggage handled door to door.",
    descriptionTh: "จากสุวรรณภูมิถึงลานจอดริมแม่น้ำใน 18 นาที สองท่าน ดูแลสัมภาระถึงห้อง",
    category: "transfer",
    price: 38000,
    unit: "stay",
    image: "/images/facilities/airport-transfer-1280.webp",
  },
  {
    key: "private-chef",
    nameEn: "Private chef dinner",
    nameTh: "มื้อค่ำเชฟส่วนตัว",
    descriptionEn: "Seven courses cooked on your balcony or in the pavilion, menu written around you the day before.",
    descriptionTh: "เจ็ดคอร์สปรุงสดที่ระเบียงหรือศาลาริมน้ำ เมนูออกแบบตามคุณล่วงหน้าหนึ่งวัน",
    category: "dining",
    price: 9800,
    unit: "person",
    image: "/images/events/pavilion-dinner-1280.webp",
  },
  {
    key: "spa-itinerary",
    nameEn: "Bespoke spa itinerary",
    nameTh: "โปรแกรมสปาเฉพาะคุณ",
    descriptionEn: "A daily 90-minute treatment designed with our therapist, in the teak spa room or in your suite.",
    descriptionTh: "ทรีตเมนต์ 90 นาทีทุกวัน ออกแบบร่วมกับนักบำบัด ในห้องสปาไม้สักหรือในห้องพักของคุณ",
    category: "wellness",
    price: 4200,
    unit: "night",
    image: "/images/facilities/housekeeping-1280.webp",
  },
  {
    key: "river-longtail",
    nameEn: "Private long-tail at dusk",
    nameTh: "เรือหางยาวส่วนตัวยามเย็น",
    descriptionEn: "Ninety minutes on the Chao Phraya at golden hour with a captain who grew up on it.",
    descriptionTh: "เก้าสิบนาทีบนเจ้าพระยายามแสงทอง กับกัปตันที่เติบโตบนแม่น้ำสายนี้",
    category: "experience",
    price: 5600,
    unit: "stay",
    image: "/images/facilities/pier-breakfast-1280.webp",
  },
  {
    key: "airport-car",
    nameEn: "Airport car, both ways",
    nameTh: "รถรับส่งสนามบินไป-กลับ",
    descriptionEn: "A quiet car and a driver who waits. Flight tracked, no meeting point to find.",
    descriptionTh: "รถส่วนตัวพร้อมคนขับที่รอคุณ ติดตามเที่ยวบินให้ ไม่ต้องหาจุดนัดพบ",
    category: "transfer",
    price: 2400,
    unit: "stay",
    image: "/images/facilities/airport-transfer-640.webp",
  },
  {
    key: "champagne-arrival",
    nameEn: "Champagne on arrival",
    nameTh: "แชมเปญต้อนรับ",
    descriptionEn: "A bottle on ice in the room, with river fruit and the house's own dried mango.",
    descriptionTh: "แชมเปญแช่เย็นรอในห้อง พร้อมผลไม้ริมน้ำและมะม่วงอบแห้งสูตรบ้าน",
    category: "dining",
    price: 3200,
    unit: "stay",
    image: "/images/dining/riverside-sundowner-640.webp",
  },
  {
    key: "nanny",
    nameEn: "Nanny, per evening",
    nameTh: "พี่เลี้ยงเด็ก ต่อค่ำ",
    descriptionEn: "A vetted, English- and Thai-speaking nanny from 18:00 to midnight.",
    descriptionTh: "พี่เลี้ยงที่ผ่านการตรวจสอบ พูดไทยและอังกฤษ 18:00 ถึงเที่ยงคืน",
    category: "family",
    price: 1800,
    unit: "night",
    image: "/images/facilities/courtyard-garden-640.webp",
  },
  {
    key: "late-checkout",
    nameEn: "Late check-out to 18:00",
    nameTh: "เช็คเอาท์ช้าถึง 18:00",
    descriptionEn: "Keep the room through the afternoon. Subject to the house being able to hold it.",
    descriptionTh: "ใช้ห้องได้ถึงบ่ายแก่ ๆ ขึ้นอยู่กับความพร้อมของบ้าน",
    category: "experience",
    price: 1500,
    unit: "stay",
    image: "",
  },
];

export async function deleteV15() {
  await prisma.payment.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.guestNote.deleteMany();
  await prisma.report.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.staffSession.deleteMany();
  await prisma.staffUser.deleteMany();
  await prisma.inboundEvent.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.channelRoomMap.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.yieldRule.deleteMany();
}

/** Channels go in BEFORE bookings so seeded OTA stays can carry their provenance. */
export async function seedChannels(
  roomIds: string[]
): Promise<{ agoda: string; booking: string; loopback: string }> {
  await prisma.booking.updateMany({ data: { channelId: null } });
  await prisma.channel.deleteMany();
  const mk = async (kind: string, name: string, enabled: boolean, commissionPct: number, secret: string) =>
    prisma.channel.create({
      data: {
        hotelId: "default",
        kind,
        name,
        enabled,
        commissionPct,
        mode: "both",
        secretEnc: storeSecret(secret),
        roomMaps: {
          create: roomIds.map((id, i) => ({
            roomId: id,
            externalRoomId: `${kind.replace(/\W/g, "").toUpperCase().slice(0, 3)}-${1001 + i}`,
            externalRateId: "BAR",
          })),
        },
      },
    });
  const [loopback, agoda, booking] = await Promise.all([
    mk("loopback", "Sandbox", true, 15, "demo-loopback-secret"),
    mk("agoda", "Agoda", false, 17, ""),
    mk("booking.com", "Booking", false, 15, ""),
  ]);
  return { agoda: agoda.id, booking: booking.id, loopback: loopback.id };
}

export type SeededBookingRow = {
  id: string;
  code: string;
  source: string;
  amount: number;
  status: string;
  checkIn: string;
  checkOut: string;
  roomSlug: string;
  email: string;
};

export async function seedV15(today: string, bookings: SeededBookingRow[]) {
  // Staff
  await prisma.staffUser.createMany({
    data: SEED_STAFF.map((s) => ({
      hotelId: "default",
      email: s.email,
      name: s.name,
      role: s.role,
      passwordHash: hashPassword(seedStaffPassword(s.role)),
    })),
  });

  // Packages
  await prisma.addon.createMany({
    data: ADDONS.map((a, i) => ({ ...a, hotelId: "default", order: i, published: true })),
  });

  // Yield · demand pricing the executive view can point at
  await prisma.yieldRule.createMany({
    data: [
      { hotelId: "default", kind: "occupancy", label: "High demand", threshold: 80, multiplier: 1.12 },
      { hotelId: "default", kind: "lead_time", label: "Early bird", threshold: 45, multiplier: 0.92 },
      {
        hotelId: "default",
        kind: "min_stay",
        label: "New Year minimum stay",
        minNights: 2,
        startDate: `${today.slice(0, 4)}-12-30`,
        endDate: `${Number(today.slice(0, 4)) + 1}-01-02`,
      },
    ],
  });

  // Payments · direct stays paid a deposit (some in full), OTA stays collected by the channel
  const paymentRows: {
    bookingId: string;
    provider: string;
    method: string;
    amount: number;
    status: string;
    providerRef: string;
    paidAt: Date;
  }[] = [];
  const bookingMoney: { id: string; paidAmount: number; paymentStatus: string }[] = [];
  bookings.forEach((b, i) => {
    if (b.status === "cancelled") return;
    if (b.source === "Direct") {
      const full = b.status === "out" || i % 4 === 0;
      const amount = full ? b.amount : Math.round(b.amount * 0.3);
      const rail = i % 3 === 0 ? "stripe" : i % 3 === 1 ? "promptpay" : "wire";
      paymentRows.push({
        bookingId: b.id,
        provider: rail,
        method: rail === "stripe" ? "card" : rail,
        amount,
        status: "succeeded",
        providerRef: `seed-${b.code}`,
        paidAt: new Date(Date.parse(b.checkIn + "T00:00:00Z") - 86_400_000 * 9),
      });
      bookingMoney.push({ id: b.id, paidAmount: amount, paymentStatus: full ? "paid" : "deposit" });
    } else {
      paymentRows.push({
        bookingId: b.id,
        provider: "channel",
        method: b.source.toLowerCase(),
        amount: b.amount,
        status: "succeeded",
        providerRef: `${b.source}-${b.code}`,
        paidAt: new Date(Date.parse(b.checkIn + "T00:00:00Z") - 86_400_000 * 3),
      });
      bookingMoney.push({ id: b.id, paidAmount: b.amount, paymentStatus: "paid" });
    }
  });
  await prisma.payment.createMany({ data: paymentRows });
  // A handful of updates · bounded (≤40 rows) so the reseed stays inside its budget.
  await prisma.$transaction(
    bookingMoney.map((m) =>
      prisma.booking.update({
        where: { id: m.id },
        data: { paidAmount: m.paidAmount, paymentStatus: m.paymentStatus },
      })
    )
  );

  // Service requests · the desk has something to do
  const inHouse = bookings.filter((b) => b.status === "in").slice(0, 3);
  if (inHouse.length) {
    await prisma.serviceRequest.createMany({
      data: [
        {
          hotelId: "default",
          bookingId: inHouse[0]?.id,
          kind: "room_service",
          title: "Breakfast on the balcony at 07:30",
          details: "Two Thai breakfasts, one without chilli, cold-brew for both.",
          due: `${today} 07:30`,
          status: "new",
          source: "concierge_ai",
        },
        {
          hotelId: "default",
          bookingId: inHouse[1]?.id ?? inHouse[0]?.id,
          kind: "transfer",
          title: "Airport car for Sunday departure",
          details: "Flight TG910 at 13:00, pick up 09:15.",
          due: addDaysIso(today, 2),
          status: "accepted",
          source: "guest",
        },
        {
          hotelId: "default",
          bookingId: inHouse[2]?.id ?? inHouse[0]?.id,
          kind: "spa",
          title: "Couples massage before dinner",
          details: "Around 17:00, the teak spa room if it is free.",
          due: `${today} 17:00`,
          status: "new",
          source: "guest",
        },
      ],
    });
  }

  // Preference log for the recurring guests
  const guests = await prisma.guest.findMany({ take: 4, orderBy: { name: "asc" } });
  if (guests.length) {
    await prisma.guest.update({
      where: { id: guests[0].id },
      data: { vip: true, preferences: "River-facing only · feather-free pillows · reads the FT at breakfast" },
    });
    await prisma.guestNote.createMany({
      data: [
        { guestId: guests[0].id, tag: "preference", body: "Prefers the top floor and a late breakfast." },
        { guestId: guests[0].id, tag: "occasion", body: "Anniversary every stay in August · flowers in the room." },
        ...(guests[1] ? [{ guestId: guests[1].id, tag: "allergy", body: "Shellfish allergy · kitchen briefed." }] : []),
        ...(guests[2] ? [{ guestId: guests[2].id, tag: "note", body: "Travels with a small dog · Garden Room." }] : []),
      ],
    });
  }
}
