/**
 * Seed · the six-room five-star catalogue · ~40 bookings past+future · guests · email template · demo meta
 * Shared by prisma/seed.ts, the reseed cron and POST /api/data/reset
 */
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/db";
import { assertWritable } from "@/lib/readOnly";
import { groupRulesByRoom, quoteStay, toPriceRule } from "@/lib/pricing";
import { imageUrl } from "@/lib/roomMedia";
import { ROOM_CATALOGUE } from "@/lib/rooms";

type SeedRoom = {
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
  photos: string[];
  amenities: string[];
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
  urgencyEn?: string;
  urgencyTh?: string;
};

/**
 * v17 A4 · the five-star catalogue, seeded FROM the catalogue (lib/rooms.ts),
 * so the database and the guest pages can never disagree about which rooms
 * exist or what they cost at base. The database row carries the operating
 * values (rate, OTA rate, on sale or not) keyed by slug, and copies of the
 * words and photographs for the owner panel; guest pages read their words
 * and photographs from the catalogue itself.
 */
const ROOMS: SeedRoom[] = ROOM_CATALOGUE.map((r) => ({
  id: r.slug,
  slug: r.slug,
  shortKey: r.shortKey,
  nameEn: r.name.en,
  nameTh: r.name.th,
  rate: r.rate,
  ota: r.ota,
  metaEn: r.summary.en,
  metaTh: r.summary.th,
  descriptionEn: r.description.en,
  descriptionTh: r.description.th,
  photos: r.images.map((i) => imageUrl(i.id)).filter(Boolean),
  amenities: r.amenities,
  capacity: r.capacity,
  bedTypeEn: r.beds.en,
  bedTypeTh: r.beds.th,
  sizeM2: r.sizeM2,
  viewEn: r.view.en,
  viewTh: r.view.th,
  floorEn: r.floor.en,
  floorTh: r.floor.th,
  bathtub: r.bathtub,
  balcony: r.balcony,
  pets: false,
  active: true,
}));

const GUESTS = [
  { guest: "Claire Dubois", phone: "+33 6 12 34 56 78", email: "claire.dubois@email.com", nationality: "FR" },
  { guest: "Daniel Meier", phone: "+49 170 1234567", email: "daniel.meier@email.de", nationality: "DE" },
  { guest: "Yuki Tanaka", phone: "+81 90 1234 5678", email: "yuki.tanaka@email.jp", nationality: "JP" },
  { guest: "Tom & Sarah Ellis", phone: "+44 7700 900123", email: "ellis.family@email.co.uk", nationality: "GB" },
  { guest: "Marco Rossi", phone: "+39 333 1234567", email: "marco.rossi@email.it", nationality: "IT" },
  { guest: "Emma Laurent", phone: "+33 6 98 76 54 32", email: "emma.laurent@email.fr", nationality: "FR" },
  { guest: "James Whitfield", phone: "+1 415 555 0198", email: "j.whitfield@email.com", nationality: "US" },
  { guest: "Li Wei", phone: "+86 138 0013 8000", email: "li.wei@email.cn", nationality: "CN" },
  { guest: "Sofia Andersson", phone: "+46 70 123 4567", email: "sofia.a@email.se", nationality: "SE" },
  { guest: "Raj Patel", phone: "+91 98 7654 3210", email: "raj.patel@email.in", nationality: "IN" },
  { guest: "Anna Kowalski", phone: "+48 600 123 456", email: "anna.k@email.pl", nationality: "PL" },
  { guest: "Chen Mei", phone: "+65 9123 4567", email: "chen.mei@email.sg", nationality: "SG" },
  { guest: "Lucas Silva", phone: "+55 11 98765 4321", email: "lucas.s@email.br", nationality: "BR" },
  { guest: "Hannah Kim", phone: "+82 10 1234 5678", email: "hannah.kim@email.kr", nationality: "KR" },
  { guest: "Oliver Brown", phone: "+61 412 345 678", email: "oliver.b@email.au", nationality: "AU" },
];

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

type SeedRateRule = {
  roomId: string;
  kind: string;
  label: string;
  startDate: string;
  endDate: string;
  multiplier: number | null;
  price: number | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(year: number, month1: number, day: number): string {
  return `${year}-${pad2(month1)}-${pad2(day)}`;
}

function lastFebruaryDay(year: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return leap ? 29 : 28;
}

/**
 * Demo rate rules · seeded relative to seed time so the sandbox always has
 * visibly different prices on different days, however long after launch it is
 * reseeded. Three layers, exactly the ones the owner panel exposes:
 *   high season Dec-Feb (+10%), Songkran 13-15 Apr (date override), and the
 *   coming Friday + Saturday as a weekend premium.
 * The weekend rule is what makes a near-term stay cross a season boundary.
 */
function seedRateRules(roomId: string, anchor: Date): SeedRateRule[] {
  const anchorIso = iso(anchor);
  const year = anchor.getFullYear();
  const rules: SeedRateRule[] = [];

  // High season · Dec 1 through the end of February, two winters ahead.
  for (const y of [year, year + 1]) {
    const endDate = ymd(y + 1, 2, lastFebruaryDay(y + 1));
    if (endDate < anchorIso) continue;
    rules.push({
      roomId,
      kind: "season",
      label: "High season",
      startDate: ymd(y, 12, 1),
      endDate,
      multiplier: 1.1,
      price: null,
    });
  }

  // Songkran · a specific-date override, not a season.
  for (const y of [year, year + 1, year + 2]) {
    const endDate = ymd(y, 4, 15);
    if (endDate < anchorIso) continue;
    rules.push({
      roomId,
      kind: "override",
      label: "Songkran",
      startDate: ymd(y, 4, 13),
      endDate,
      multiplier: 1.35,
      price: null,
    });
  }

  // Weekend premium · the coming Friday and Saturday.
  const toFriday = (5 - anchor.getDay() + 7) % 7;
  const friday = addDays(anchor, toFriday === 0 ? 7 : toFriday);
  rules.push({
    roomId,
    kind: "season",
    label: "Weekend premium",
    startDate: iso(friday),
    endDate: iso(addDays(friday, 1)),
    multiplier: 1.15,
    price: null,
  });

  return rules;
}

/**
 * v12 · Dining menu seed · EN carried in the *Th columns pending the Thai pass
 * (never author Thai). Categories + dishes are owner-editable after seed.
 */
type SeedDish = { name: string; description: string; price: number };
type SeedDiningCategory = { id: string; name: string; dishes: SeedDish[] };

/**
 * Thai for the seeded menu and events · installed verbatim from the Thai pass.
 * Keyed by seeded id so the pairing is checkable line by line; anything absent
 * falls back to the English string rather than rendering empty.
 */
const DINING_TH: Record<
  string,
  { name: string; dishes: { name: string; description: string }[] }
> = {
  "dc-pier-breakfast": {
    name: "อาหารเช้าที่ท่าเรือ",
    dishes: [
      {
        name: "ข้าวต้มกุ้งแม่น้ำ",
        description:
          "ข้าวต้มเคี่ยวในน้ำสต๊อกกุ้ง กุ้งแม่น้ำ ขิงอ่อน และกระเทียมเจียว",
      },
      {
        name: "ไข่เจียวปู",
        description:
          "ไข่เจียวสไตล์ข้างทางแน่นด้วยเนื้อปู เสิร์ฟบนข้าวหอมมะลิพร้อมซอสศรีราชา",
      },
      {
        name: "ผลไม้รวมจากท่าเรือ",
        description:
          "ตามแต่เรือเช้าจะพามา: มะม่วง ส้มโอ ชมพู่ และพริกเกลือมะนาว",
      },
      {
        name: "ขนมครก",
        description: "ขนมครกขอบกรอบจากกระทะทองเหลือง กะทิยังอุ่นจากเตา",
      },
      {
        name: "ไข่สไตล์บ้านไม้สัก",
        description:
          "ไข่สองฟองจากนครปฐม มะเขือเทศย่าง ไส้กรอกหมู และขนมปังจากร้านหัวมุม",
      },
      {
        name: "กาแฟดริปเชียงราย",
        description:
          "อาราบิก้าซิงเกิลออริจินคั่วที่เชียงราย ดริปช้า ๆ ที่เคาน์เตอร์ริมท่าเรือ",
      },
    ],
  },
  "dc-thai-kitchen": {
    name: "ครัวไทย",
    dishes: [
      {
        name: "ผัดไทยกุ้งแม่น้ำ",
        description:
          "เส้นผัดไฟแรงคลุกน้ำมะขาม ห่อด้วยไข่เน็ต ท็อปด้วยกุ้งแม่น้ำย่างหนึ่งตัว",
      },
      {
        name: "มัสมั่นซี่โครงเนื้อ",
        description:
          "ซี่โครงเนื้อตุ๋นห้าชั่วโมงในแกงมัสมั่น ถั่วลิสงคั่ว และแตงกวาดอง",
      },
      {
        name: "ปลาเผาเกลือ",
        description:
          "ปลานิลทั้งตัวพอกเกลือและตะไคร้ ย่างถ่าน เสิร์ฟพร้อมน้ำจิ้มสามแบบ",
      },
      {
        name: "แกงเขียวหวานไก่ย่าง",
        description:
          "สะโพกไก่ย่างถ่านในแกงเขียวหวาน มะเขือพวงและโหระพา เสิร์ฟกับโรตี",
      },
      {
        name: "ยำส้มโอ",
        description:
          "ส้มโอ มะพร้าวคั่ว กุ้งแห้ง และน้ำยำมะนาวรสจัดจ้าน",
      },
      {
        name: "ผัดผักบุ้งไฟแดง",
        description:
          "ผักบุ้งผัดกระทะร้อนกับเต้าเจี้ยว กระเทียม และพริกเผ็ดนิด ๆ",
      },
      {
        name: "ต้มยำกุ้งสูตรบ้าน",
        description: "น้ำซุปเปรี้ยวเผ็ดกับกุ้งแม่น้ำ เห็ดฟาง และข่าอ่อน",
      },
      {
        name: "ข้าวเหนียวมะม่วง",
        description: "มะม่วงน้ำดอกไม้ ข้าวเหนียวมูน และกะทิเค็มหอมมัน",
      },
    ],
  },
  "dc-drinks": {
    name: "เครื่องดื่มและค็อกเทล",
    dishes: [
      {
        name: "ค็อกเทลริมน้ำ",
        description:
          "ค็อกเทลประจำบ้าน: รัมไทย มะขาม น้ำตาลมะพร้าว และมะนาว คนกับน้ำแข็งก้อนใหญ่",
      },
      {
        name: "น้ำตะไคร้ใบเตย",
        description: "ตะไคร้และใบเตยสกัดเย็นเสิร์ฟบนน้ำแข็ง หวานน้อย สดชื่น",
      },
      {
        name: "ชาเก๊กฮวยเย็น",
        description: "ชาเก๊กฮวยแบบตลาดเก่า ชงใหม่ทุกเช้า เลือกเติมน้ำผึ้งได้",
      },
      {
        name: "สิงห์ที่ท่าเรือ",
        description: "เบียร์เย็นเจี๊ยบพร้อมมะนาวหั่นซีก อร่อยที่สุดตอนพระอาทิตย์ตก",
      },
    ],
  },
};

const EVENTS_TH: Record<string, { title: string; description: string }> = {
  "ev-loy-krathong": {
    title: "ดินเนอร์ลอยกระทงริมน้ำ",
    description:
      "ลอยกระทงจากท่าเรือของเรา แล้วนั่งลงกับดินเนอร์ไทย 5 คอร์สใต้แสงจันทร์เต็มดวง รอบเดียว 28 ที่นั่ง",
  },
  "ev-jazz-brunch": {
    title: "แจ๊สบรันช์วันอาทิตย์",
    description:
      "วงทริโอบนลานศาลา บรันช์ไทยแบบฟรีโฟลว์ พร้อมวิวเรือที่ค่อย ๆ ผ่านไป ทุกวันอาทิตย์ 11:30 ถึง 15:00",
  },
  "ev-songkran-lunch": {
    title: "มื้อกลางวันสงกรานต์ในสวน",
    description:
      "สงกรานต์แบบดั้งเดิม: น้ำสำหรับรดให้พร ไม่ใช่สาดกัน ขันโตกใต้ต้นมะม่วงกับทั้งบ้าน",
  },
};

const DINING: SeedDiningCategory[] = [
  {
    id: "dc-pier-breakfast",
    name: "Breakfast on the pier",
    dishes: [
      {
        name: "Rice soup with river prawns",
        description:
          "Gentle rice soup simmered in prawn stock, river prawns, young ginger and crispy garlic.",
        price: 220,
      },
      {
        name: "Thai omelette with crab",
        description:
          "Folded street-style omelette heavy with crab meat, served over jasmine rice with Sriracha.",
        price: 260,
      },
      {
        name: "Pier fruit tray",
        description:
          "Whatever the morning boat brought: mango, pomelo, rose apple and lime-chilli salt.",
        price: 180,
      },
      {
        name: "Coconut pancakes",
        description:
          "Crisp-edged khanom krok off the brass pan, coconut cream still warm from the griddle.",
        price: 140,
      },
      {
        name: "Eggs any way, teak-house style",
        description:
          "Two eggs from Nakhon Pathom, grilled tomato, pork sausage and toast from the corner bakery.",
        price: 190,
      },
      {
        name: "Chiang Rai pour-over",
        description:
          "Single-origin arabica roasted in Chiang Rai, brewed slow at the pier counter.",
        price: 120,
      },
    ],
  },
  {
    id: "dc-thai-kitchen",
    name: "Thai kitchen",
    dishes: [
      {
        name: "River prawn pad thai",
        description:
          "Charred rice noodles folded with tamarind and wrapped in an egg net, one grilled river prawn on top.",
        price: 320,
      },
      {
        name: "Massaman beef short rib",
        description:
          "Five-hour short rib in massaman curry, roasted peanuts and pickled cucumber.",
        price: 420,
      },
      {
        name: "Grilled river fish in salt crust",
        description:
          "Whole tilapia packed in salt and lemongrass, grilled over charcoal, three dips.",
        price: 380,
      },
      {
        name: "Green curry with grilled chicken",
        description:
          "Charcoal chicken thigh in green curry, Thai eggplant and sweet basil, roti on the side.",
        price: 290,
      },
      {
        name: "Pomelo salad",
        description:
          "Yam som-o: pomelo, toasted coconut, dried shrimp and a lime dressing that bites back.",
        price: 240,
      },
      {
        name: "Stir-fried morning glory",
        description:
          "Wok-blistered morning glory with yellow bean, garlic and a whisper of chilli.",
        price: 160,
      },
      {
        name: "Tom yum goong, house style",
        description:
          "Hot-sour broth with river prawns, straw mushrooms and young galangal.",
        price: 300,
      },
      {
        name: "Mango sticky rice",
        description:
          "Nam dok mai mango, coconut sticky rice and salted coconut cream.",
        price: 180,
      },
    ],
  },
  {
    id: "dc-drinks",
    name: "Drinks & cocktails",
    dishes: [
      {
        name: "Riverside sundowner",
        description:
          "The house cocktail: Thai rum, tamarind, palm sugar and lime, stirred over one big cube.",
        price: 280,
      },
      {
        name: "Lemongrass pandan cooler",
        description:
          "Cold-steeped lemongrass and pandan over crushed ice, barely sweet.",
        price: 120,
      },
      {
        name: "Chrysanthemum iced tea",
        description:
          "Old-market chrysanthemum tea, brewed every morning, honey optional.",
        price: 100,
      },
      {
        name: "Singha on the pier",
        description: "Ice-cold bottle with a lime wedge, best at sunset.",
        price: 130,
      },
    ],
  },
];

/** First yyyy-mm-dd of month/day on or after the anchor date. */
function nextOccurrence(anchor: Date, month1: number, day: number): string {
  const y = anchor.getFullYear();
  const candidate = ymd(y, month1, day);
  return candidate >= iso(anchor) ? candidate : ymd(y + 1, month1, day);
}

/**
 * The steps of a reseed, in the order they run inside the transaction. Named
 * so a test can stop the seed after any one of them (see SeedOptions).
 */
export const SEED_STEPS = [
  "deletes",
  "hotel",
  "rooms",
  "rates",
  "bookings",
  "guests",
  "emailTemplate",
  "demoMeta",
  "users",
  "guestBookings",
  "diningCategories",
  "diningItems",
  "events",
] as const;
export type SeedStep = (typeof SEED_STEPS)[number];

export type SeedOptions = {
  /**
   * Test hook · throw right after this step, inside the transaction, so the
   * gate (scripts/hf1-seed-abort.ts) can prove a failed reseed rolls back to
   * exactly the data that was there before. A function parameter only: no
   * route passes it, and no env var or request input can reach it.
   */
  failAfter?: SeedStep;
};

/** Thrown by the failAfter test hook. */
export class SeedAbortedForTest extends Error {
  constructor(public step: SeedStep) {
    super(`seed aborted after step "${step}" (test hook)`);
    this.name = "SeedAbortedForTest";
  }
}

/**
 * Transaction budget. The reset route and the cron both run with
 * maxDuration 60 s on Vercel. Rows are built before the transaction opens, so
 * it holds one pooled connection only for 16 deletes and 12 bulk inserts:
 * about a second next to the database, and about 10 s even from a distant
 * region. maxWait + timeout stays under the function limit, so the database
 * rolls back on its own terms rather than the platform killing the function
 * midway.
 */
const SEED_TX_MAX_WAIT_MS = 10_000;
const SEED_TX_TIMEOUT_MS = 40_000;

/**
 * Replace every boutique table with the demo seed, as ONE all-or-nothing
 * interactive transaction: the deletes and one createMany per table either all
 * commit or none do, so a timeout, a crash or a constraint error can never
 * leave a half-empty site (before HF-1 a 504 after the deletes left production
 * without a menu or events). Works through the Supabase pooler in transaction
 * mode (pgbouncer=true): an interactive transaction holds one server
 * connection for its whole life and uses no named prepared statements.
 */
export async function seedDatabase(options: SeedOptions = {}) {
  // v17 · A read-only deployment (a preview) never seeds. Refuse before the
  // transaction opens, so not even a connection is taken for it.
  assertWritable("seedDatabase");
  console.log("Seeding TEAK HOUSE v8…");

  // ── Build every row first · no database work in here ─────────────────────
  // Each table is written with a single createMany, so every row object is
  // complete: required columns set explicitly, the rest left to their
  // schema defaults (ids by cuid, timestamps by now()).
  const hotelRow = {
    id: "default",
    name: "The Teak House",
    tagline: "Riverside Hotel · Bangkok",
    email: "stay@teakhouse.demo",
    phone: "+66 2 000 0000",
    lineId: "@teakhouse",
    address: "Charoenkrung 44, Bang Rak, Bangkok 10500",
    addressLine: "Charoenkrung 44, Bang Rak",
    city: "Bangkok",
    country: "Thailand",
    postalCode: "10500",
    lat: 13.7234,
    lng: 100.5142,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    cancelPolicy: "Free cancellation up to 3 days before arrival.",
    petsPolicy: "We regret that pets cannot be accommodated, with the exception of assistance animals.",
    depositPct: 30,
  };

  // One round trip per table, not one per row. The demo reset runs inside a
  // serverless function with a hard time budget, and ~96 sequential creates
  // against a remote database blew through it · the gateway returned 504 having
  // already deleted everything, which left the live demo with no menu and no
  // events. Bulk writes take the same work down to a handful of round trips.
  const roomRows = ROOMS.map((r) => ({
    id: r.id,
    hotelId: "default",
    slug: r.slug,
    shortKey: r.shortKey,
    nameEn: r.nameEn,
    nameTh: r.nameTh,
    rate: r.rate,
    ota: r.ota,
    metaEn: r.metaEn,
    metaTh: r.metaTh,
    descriptionEn: r.descriptionEn,
    descriptionTh: r.descriptionTh,
    photos: JSON.stringify(r.photos),
    amenities: JSON.stringify(r.amenities),
    capacity: r.capacity,
    bedTypeEn: r.bedTypeEn,
    bedTypeTh: r.bedTypeTh,
    sizeM2: r.sizeM2,
    viewEn: r.viewEn,
    viewTh: r.viewTh,
    floorEn: r.floorEn,
    floorTh: r.floorTh,
    bathtub: r.bathtub,
    balcony: r.balcony,
    pets: r.pets,
    active: r.active,
    urgencyEn: r.urgencyEn ?? null,
    urgencyTh: r.urgencyTh ?? null,
  }));

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const seededRules = ROOMS.flatMap((r) => seedRateRules(r.id, today));

  // Same rules the booking engine will see, keyed the way it wants them.
  const rateRulesByRoom = groupRulesByRoom(
    seededRules.map((r, i) => toPriceRule({ ...r, id: `seed-${i}` }))
  );

  const sources = ["Direct", "Agoda", "Booking"] as const;
  const statusesPast = ["out", "out", "out", "cancelled"] as const;
  const statusesNear = ["in", "ok", "ok", "out"] as const;
  const statusesFuture = ["ok", "ok", "ok"] as const;

  const bookingSpecs: { offsetIn: number; nights: number; statusPool: readonly string[] }[] = [];
  // Past
  for (let i = 0; i < 14; i++) {
    bookingSpecs.push({
      offsetIn: -45 + i * 3,
      nights: 2 + (i % 3),
      statusPool: statusesPast,
    });
  }
  // Around now
  for (let i = 0; i < 10; i++) {
    bookingSpecs.push({
      offsetIn: -5 + i,
      nights: 2 + (i % 4),
      statusPool: statusesNear,
    });
  }
  // Future
  for (let i = 0; i < 16; i++) {
    bookingSpecs.push({
      offsetIn: 8 + i * 2,
      nights: 2 + (i % 3),
      statusPool: statusesFuture,
    });
  }

  let codeN = 4200;
  // Guests are deduplicated here rather than upserted row by row · the same
  // fifteen people recur across forty bookings.
  const bookingRows = bookingSpecs.map((spec, i) => {
    const room = ROOMS[i % ROOMS.length];
    const g = GUESTS[i % GUESTS.length];
    const checkIn = iso(addDays(today, spec.offsetIn));
    const checkOut = iso(addDays(today, spec.offsetIn + spec.nights));
    const source = sources[i % sources.length];
    const status = spec.statusPool[i % spec.statusPool.length];
    // Priced the same way the booking engine prices a live stay · so the
    // owner dashboard's revenue matches what the rate calendar says.
    const amount = quoteStay(
      room.rate,
      checkIn,
      checkOut,
      rateRulesByRoom[room.id] ?? []
    ).total;
    const prefix =
      source === "Direct" ? "TKH" : source === "Agoda" ? "AGD" : "BKG";

    return {
      id: `bk-${4300 + i}`,
      hotelId: "default",
      code: `${prefix}-${codeN++}`,
      guest: g.guest,
      phone: g.phone,
      email: g.email,
      roomSlug: room.slug,
      checkIn,
      checkOut,
      source,
      amount,
      status,
      notes: i % 5 === 0 ? "Late arrival noted." : "",
      nationality: g.nationality,
      adults: 1 + (i % 2),
      children: i % 4 === 0 ? 1 : 0,
      passportId: i % 3 === 0 ? `P${100000 + i}` : null,
    };
  });

  const guestRows = new Map<string, {
    id: string;
    name: string;
    email: string;
    phone: string;
    nationality: string;
  }>();
  for (const g of GUESTS) {
    guestRows.set(`guest-${g.email}`, {
      id: `guest-${g.email}`,
      name: g.guest,
      email: g.email,
      phone: g.phone,
      nationality: g.nationality,
    });
  }

  const emailTemplateRow = {
    hotelId: "default",
    key: "booking_confirmation",
    subject: "Your stay at {{hotelName}} · {{code}}",
    body: "Dear {{guestName}},\n\nThank you for booking {{roomName}} from {{checkIn}} to {{checkOut}}.\nTotal: {{amount}}\nDeposit received: {{deposit}}\n\nSee you by the river.\n{{hotelName}}",
  };

  // Demo guest account linked to two bookings · the user and its links are
  // two bulk writes (a nested create is not available in createMany).
  const userRow = {
    id: "gu-demo",
    name: "Demo Guest",
    email: "guest@teakhouse.demo",
    password: "demo1234",
  };
  const guestBookingRows = ["bk-4300", "bk-4315"].map((bookingId) => ({
    userId: userRow.id,
    bookingId,
  }));

  // v12 · dining menu · *Th columns mirror EN pending the Thai pass
  // Two writes for the whole menu · categories, then every dish at once.
  const categoryRows = DINING.map((cat, c) => ({
    id: cat.id,
    hotelId: "default",
    nameEn: cat.name,
    nameTh: DINING_TH[cat.id]?.name ?? cat.name,
    order: c,
    published: true,
  }));

  const dishRows = DINING.flatMap((cat) =>
    cat.dishes.map((d, i) => ({
      id: `${cat.id}-i${i + 1}`,
      categoryId: cat.id,
      nameEn: d.name,
      nameTh: DINING_TH[cat.id]?.dishes[i]?.name ?? d.name,
      descriptionEn: d.description,
      descriptionTh:
        DINING_TH[cat.id]?.dishes[i]?.description ?? d.description,
      price: d.price,
      order: i,
      published: true,
    }))
  );

  // v12 · special events · dates roll to the next occurrence so the demo
  // sandbox never shows a past festival, however long after launch it reseeds.
  const toSunday = (7 - today.getDay()) % 7 || 7;
  const EVENTS = [
    {
      id: "ev-loy-krathong",
      title: "Loy Krathong riverside dinner",
      date: nextOccurrence(today, 11, 24),
      description:
        "Float a krathong from our pier, then sit down to a five-course Thai dinner under the full moon. One seating, 28 guests.",
      // An evening event gets the evening photograph · the pavilion after dark.
      image: "/images/events/pavilion-dinner-1280.webp",
    },
    {
      id: "ev-jazz-brunch",
      title: "Sunday jazz brunch",
      date: iso(addDays(today, toSunday)),
      description:
        "A trio on the pavilion deck, free-flow Thai brunch plates and the slow boats going by. Every Sunday, 11:30 to 15:00.",
      // Daytime event, daytime photograph · tables on the pier at breakfast.
      image: "/images/facilities/pier-breakfast-1280.webp",
    },
    {
      id: "ev-songkran-lunch",
      title: "Songkran garden lunch",
      date: nextOccurrence(today, 4, 13),
      description:
        "Songkran the old way: water for blessing, not soaking. A khan tok lunch under the mango tree with the whole house.",
      image: "/images/facilities/courtyard-garden-1280.webp",
    },
  ];
  const eventRows = EVENTS.map((ev) => ({
    id: ev.id,
    hotelId: "default",
    titleEn: ev.title,
    titleTh: EVENTS_TH[ev.id]?.title ?? ev.title,
    date: ev.date,
    descriptionEn: ev.description,
    descriptionTh: EVENTS_TH[ev.id]?.description ?? ev.description,
    image: ev.image,
    published: true,
  }));

  // ── One transaction: delete everything, write everything ─────────────────
  const done = (step: SeedStep) => {
    if (options.failAfter === step) throw new SeedAbortedForTest(step);
  };

  await prisma.$transaction(
    async (tx) => {
      // Children before parents, so no foreign key trips. v14 · seat requests
      // point at events, so they go before events. Table reservations and
      // contact messages are guest-generated demo traffic · the reseed clears
      // them too, so the sandbox starts each day from the same known state.
      await tx.guestBooking.deleteMany();
      await tx.roomBlock.deleteMany();
      await tx.seasonalPriceRule.deleteMany();
      await tx.booking.deleteMany();
      await tx.guest.deleteMany();
      await tx.user.deleteMany();
      await tx.emailTemplate.deleteMany();
      await tx.room.deleteMany();
      await tx.hotel.deleteMany();
      await tx.demoMeta.deleteMany();
      await tx.diningItem.deleteMany();
      await tx.diningCategory.deleteMany();
      await tx.eventRequest.deleteMany();
      await tx.hotelEvent.deleteMany();
      await tx.tableReservation.deleteMany();
      await tx.contactMessage.deleteMany();
      done("deletes");

      await tx.hotel.createMany({ data: [hotelRow] });
      done("hotel");
      await tx.room.createMany({ data: roomRows });
      done("rooms");
      await tx.seasonalPriceRule.createMany({ data: seededRules });
      done("rates");
      await tx.booking.createMany({ data: bookingRows });
      done("bookings");
      await tx.guest.createMany({ data: Array.from(guestRows.values()) });
      done("guests");
      await tx.emailTemplate.createMany({ data: [emailTemplateRow] });
      done("emailTemplate");
      await tx.demoMeta.createMany({
        data: [{ id: "demo", lastReset: new Date() }],
      });
      done("demoMeta");
      await tx.user.createMany({ data: [userRow] });
      done("users");
      await tx.guestBooking.createMany({ data: guestBookingRows });
      done("guestBookings");
      await tx.diningCategory.createMany({ data: categoryRows });
      done("diningCategories");
      await tx.diningItem.createMany({ data: dishRows });
      done("diningItems");
      await tx.hotelEvent.createMany({ data: eventRows });
      done("events");
    },
    { maxWait: SEED_TX_MAX_WAIT_MS, timeout: SEED_TX_TIMEOUT_MS }
  );

  console.log(
    `Done · ${ROOMS.length} rooms · ${bookingSpecs.length} bookings · ${DINING.length} dining categories · ${dishRows.length} dishes · ${EVENTS.length} events · guests + demo user`
  );
}
