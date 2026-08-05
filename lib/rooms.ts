import type { AmenityId } from "./amenities";
import { formatBaht } from "./utils";

export type RoomShortKey = "loft" | "suite" | "garden" | "twin";

export type Room = {
  id: string;
  slug: string;
  shortKey: RoomShortKey;
  name: { en: string; th: string };
  rate: number;
  ota: number;
  meta: { en: string; th: string };
  description: { en: string; th: string };
  photos: string[];
  amenities: AmenityId[];
  capacity: number;
  bedType: { en: string; th: string };
  sizeM2: number;
  view: { en: string; th: string };
  floor: { en: string; th: string };
  bathtub: boolean;
  balcony: boolean;
  pets: boolean;
  active: boolean;
  urgency?: { en: string; th: string };
};

export const SHORT_KEY_TO_SLUG: Record<RoomShortKey, string> = {
  loft: "river-loft",
  suite: "teak-suite",
  garden: "garden-room",
  twin: "courtyard-twin",
};

export const SLUG_TO_SHORT_KEY: Record<string, RoomShortKey> = {
  "river-loft": "loft",
  "teak-suite": "suite",
  "garden-room": "garden",
  "courtyard-twin": "twin",
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=80`;

export const SEED_ROOMS: Room[] = [
  {
    id: "river-loft",
    slug: "river-loft",
    shortKey: "loft",
    name: { en: "River Loft", th: "River Loft" },
    rate: 3900,
    ota: 4700,
    meta: {
      en: "42 m² · King bed · River balcony",
      th: "42 ตร.ม. · เตียงคิง · ระเบียงริมแม่น้ำ",
    },
    description: {
      en: "The top floor to yourself: golden teak, a king bed facing the water, and a balcony where the river traffic is the evening show.",
      th: "ชั้นบนสุดเป็นของคุณ ไม้สักทอง เตียงคิงหันหน้าสู่แม่น้ำ และระเบียงที่วิวเรือคือโชว์ยามค่ำ",
    },
    photos: [
      unsplash("photo-1631049307264-da0ec9d70304"),
      unsplash("photo-1618773928121-c32242e63f39"),
      unsplash("photo-1590490360182-c33d57733427"),
      unsplash("photo-1582719478250-c89cae4dc85b"),
      unsplash("photo-1566665797739-1674de466a3a"),
      unsplash("photo-1611892440508-40a792e6e403"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "robe",
      "dryer",
      "safe",
      "minibar",
      "coffee",
      "desk",
      "balcony",
      "blackout",
      "housekeeping",
      "breakfast",
      "transfer",
      "desk24",
    ],
    capacity: 2,
    bedType: { en: "King bed", th: "เตียงคิง" },
    sizeM2: 42,
    view: { en: "River balcony", th: "ระเบียงริมแม่น้ำ" },
    floor: { en: "Top floor", th: "ชั้นบนสุด" },
    bathtub: false,
    balcony: true,
    pets: false,
    active: true,
    urgency: {
      en: "Only 2 left at this price",
      th: "เหลือ 2 ห้องราคานี้",
    },
  },
  {
    id: "teak-suite",
    slug: "teak-suite",
    shortKey: "suite",
    name: { en: "Teak Suite", th: "Teak Suite" },
    rate: 3200,
    ota: 3850,
    meta: {
      en: "36 m² · King bed · Bathtub",
      th: "36 ตร.ม. · เตียงคิง · อ่างอาบน้ำ",
    },
    description: {
      en: "The house's original master room. High ceilings, a deep soaking tub, and the smell of old teak after rain.",
      th: "ห้องมาสเตอร์ดั้งเดิมของบ้าน เพดานสูง อ่างอาบน้ำลึก และกลิ่นไม้สักเก่าหลังฝนตก",
    },
    photos: [
      unsplash("photo-1611892440504-42a792e24d32"),
      unsplash("photo-1582719508461-905c673771fd"),
      unsplash("photo-1540518614846-7eded433c457"),
      unsplash("photo-1600566752355-35792bedcfea"),
      unsplash("photo-1552321554-5fefe8c9ef14"),
      unsplash("photo-1584622650111-993a426fbf0a"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "bathtub",
      "robe",
      "dryer",
      "safe",
      "minibar",
      "coffee",
      "desk",
      "blackout",
      "housekeeping",
      "breakfast",
      "transfer",
      "desk24",
    ],
    capacity: 2,
    bedType: { en: "King bed", th: "เตียงคิง" },
    sizeM2: 36,
    view: { en: "Courtyard", th: "คอร์ทยาร์ด" },
    floor: { en: "Second floor", th: "ชั้น 2" },
    bathtub: true,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "garden-room",
    slug: "garden-room",
    shortKey: "garden",
    name: { en: "Garden Room", th: "Garden Room" },
    rate: 2400,
    ota: 2900,
    meta: {
      en: "28 m² · Queen bed · Courtyard",
      th: "28 ตร.ม. · เตียงควีน · คอร์ทยาร์ด",
    },
    description: {
      en: "Opens onto the courtyard and the mango tree. Quiet, green, and five steps from the pool.",
      th: "เปิดสู่คอร์ทยาร์ดและต้นมะม่วง เงียบสงบ ร่มรื่น ห่างจากสระน้ำเพียง 5 ก้าว",
    },
    photos: [
      unsplash("photo-1578683010236-d716f9a3f461"),
      unsplash("photo-1591087917153-872378c177a2"),
      unsplash("photo-1584132967334-10e028bd69f7"),
      unsplash("photo-1414235077428-338989a2e8c0"),
      unsplash("photo-1595526114035-0d45ed16c565"),
      unsplash("photo-1571008887538-b36bb74556e6"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "dryer",
      "safe",
      "coffee",
      "courtyard",
      "blackout",
      "housekeeping",
      "breakfast",
      "transfer",
      "desk24",
    ],
    capacity: 2,
    bedType: { en: "Queen bed", th: "เตียงควีน" },
    sizeM2: 28,
    view: { en: "Courtyard view", th: "วิวคอร์ทยาร์ด" },
    floor: { en: "Ground floor", th: "ชั้นล่าง" },
    bathtub: false,
    balcony: false,
    pets: true,
    active: true,
    urgency: {
      en: "Popular choice",
      th: "ห้องยอดนิยม",
    },
  },
  {
    id: "courtyard-twin",
    slug: "courtyard-twin",
    shortKey: "twin",
    name: { en: "Courtyard Twin", th: "Courtyard Twin" },
    rate: 2100,
    ota: 2550,
    meta: {
      en: "26 m² · 2 single beds · Desk",
      th: "26 ตร.ม. · เตียงเดี่ยว 2 · โต๊ะทำงาน",
    },
    description: {
      en: "Two proper single beds, a writing desk, and morning light. The traveller's favorite.",
      th: "เตียงเดี่ยว 2 เตียง โต๊ะเขียนหนังสือ และแสงยามเช้า ห้องโปรดของนักเดินทาง",
    },
    photos: [
      unsplash("photo-1560448204-e02f11c3d0e2"),
      unsplash("photo-1598928502111-a684ea7036fb"),
      unsplash("photo-1560185127-8726d12649a8"),
      unsplash("photo-1584133760887-c4244e998f6c"),
      unsplash("photo-1615874959477-2f584629a619"),
      unsplash("photo-1522771739844-47449f1b1172"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "dryer",
      "safe",
      "coffee",
      "desk",
      "courtyard",
      "blackout",
      "housekeeping",
      "breakfast",
      "transfer",
      "desk24",
    ],
    capacity: 2,
    bedType: { en: "2 single beds", th: "เตียงเดี่ยว 2 เตียง" },
    sizeM2: 26,
    view: { en: "Courtyard", th: "คอร์ทยาร์ด" },
    floor: { en: "Ground floor", th: "ชั้นล่าง" },
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return SEED_ROOMS.find((room) => room.slug === slug);
}

export function getRoomByKey(key: string): Room | undefined {
  const slug = SHORT_KEY_TO_SLUG[key as RoomShortKey] ?? key;
  return getRoomBySlug(slug);
}

export { formatBaht };
