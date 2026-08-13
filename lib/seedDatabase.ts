/**
 * Seed · 10 rooms · ~40 bookings past+future · guests · email template · demo meta
 * Shared by prisma/seed.ts and /api/data/reset
 */
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/db";
import { groupRulesByRoom, quoteStay, toPriceRule } from "@/lib/pricing";

const unsplash = (id: string) => `https://images.unsplash.com/${id}`;

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

const ROOMS: SeedRoom[] = [
  {
    id: "river-loft",
    slug: "river-loft",
    shortKey: "loft",
    nameEn: "River Loft",
    nameTh: "River Loft",
    rate: 3900,
    ota: 4700,
    metaEn: "42 m² · King bed · River balcony",
    metaTh: "42 ตร.ม. · เตียงคิง · ระเบียงริมแม่น้ำ",
    descriptionEn:
      "The top floor to yourself: golden teak, a king bed facing the water, and a balcony where the river traffic is the evening show.",
    descriptionTh:
      "ชั้นบนสุดเป็นของคุณ ไม้สักทอง เตียงคิงหันหน้าสู่แม่น้ำ และระเบียงที่วิวเรือคือโชว์ยามค่ำ",
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
    bedTypeEn: "King bed",
    bedTypeTh: "เตียงคิง",
    sizeM2: 42,
    viewEn: "River balcony",
    viewTh: "ระเบียงริมแม่น้ำ",
    floorEn: "Top floor",
    floorTh: "ชั้นบนสุด",
    bathtub: false,
    balcony: true,
    pets: false,
    active: true,
    urgencyEn: "Only 2 left at this price",
    urgencyTh: "เหลือ 2 ห้องราคานี้",
  },
  {
    id: "teak-suite",
    slug: "teak-suite",
    shortKey: "suite",
    nameEn: "Teak Suite",
    nameTh: "Teak Suite",
    rate: 3200,
    ota: 3850,
    metaEn: "36 m² · King bed · Bathtub",
    metaTh: "36 ตร.ม. · เตียงคิง · อ่างอาบน้ำ",
    descriptionEn:
      "The house's original master room. High ceilings, a deep soaking tub, and the smell of old teak after rain.",
    descriptionTh:
      "ห้องมาสเตอร์ดั้งเดิมของบ้าน เพดานสูง อ่างอาบน้ำลึก และกลิ่นไม้สักเก่าหลังฝนตก",
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
    bedTypeEn: "King bed",
    bedTypeTh: "เตียงคิง",
    sizeM2: 36,
    viewEn: "Courtyard",
    viewTh: "คอร์ทยาร์ด",
    floorEn: "Second floor",
    floorTh: "ชั้น 2",
    bathtub: true,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "garden-room",
    slug: "garden-room",
    shortKey: "garden",
    nameEn: "Garden Room",
    nameTh: "Garden Room",
    rate: 2400,
    ota: 2900,
    metaEn: "28 m² · Queen bed · Courtyard",
    metaTh: "28 ตร.ม. · เตียงควีน · คอร์ทยาร์ด",
    descriptionEn:
      "Opens onto the courtyard and the mango tree. Quiet, green, and five steps from the pool.",
    descriptionTh:
      "เปิดสู่คอร์ทยาร์ดและต้นมะม่วง เงียบสงบ ร่มรื่น ห่างจากสระน้ำเพียง 5 ก้าว",
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
    bedTypeEn: "Queen bed",
    bedTypeTh: "เตียงควีน",
    sizeM2: 28,
    viewEn: "Courtyard view",
    viewTh: "วิวคอร์ทยาร์ด",
    floorEn: "Ground floor",
    floorTh: "ชั้นล่าง",
    bathtub: false,
    balcony: false,
    pets: true,
    active: true,
    urgencyEn: "Popular choice",
    urgencyTh: "ห้องยอดนิยม",
  },
  {
    id: "courtyard-twin",
    slug: "courtyard-twin",
    shortKey: "twin",
    nameEn: "Courtyard Twin",
    nameTh: "Courtyard Twin",
    rate: 2100,
    ota: 2550,
    metaEn: "26 m² · 2 single beds · Desk",
    metaTh: "26 ตร.ม. · เตียงเดี่ยว 2 · โต๊ะทำงาน",
    descriptionEn:
      "Two proper single beds, a writing desk, and morning light. The traveller's favorite.",
    descriptionTh:
      "เตียงเดี่ยว 2 เตียง โต๊ะเขียนหนังสือ และแสงยามเช้า ห้องโปรดของนักเดินทาง",
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
    bedTypeEn: "2 single beds",
    bedTypeTh: "เตียงเดี่ยว 2 เตียง",
    sizeM2: 26,
    viewEn: "Courtyard",
    viewTh: "คอร์ทยาร์ด",
    floorEn: "Ground floor",
    floorTh: "ชั้นล่าง",
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "pier-studio",
    slug: "pier-studio",
    shortKey: "loft",
    nameEn: "Pier Studio",
    nameTh: "Pier Studio",
    rate: 2800,
    ota: 3350,
    metaEn: "30 m² · Queen bed · Pier view",
    metaTh: "30 ตร.ม. · เตียงควีน · วิวท่าเรือ",
    descriptionEn:
      "Light-filled studio facing the pier. Ideal for couples who want river mornings without the loft stairs.",
    descriptionTh:
      "สตูดิโอแสงสว่างหันหน้าท่าเรือ เหมาะสำหรับคู่รักที่อยากได้เช้าแม่น้ำโดยไม่ต้องขึ้นบันไดลอฟต์",
    photos: [
      unsplash("photo-1595576508898-0ad5c879a061"),
      unsplash("photo-1505693416388-ac5ce068fe85"),
      unsplash("photo-1631049552057-403cdb8f0658"),
      unsplash("photo-1566195992011-5f6b21e539aa"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "coffee",
      "desk",
      "blackout",
      "housekeeping",
      "breakfast",
      "desk24",
    ],
    capacity: 2,
    bedTypeEn: "Queen bed",
    bedTypeTh: "เตียงควีน",
    sizeM2: 30,
    viewEn: "Pier view",
    viewTh: "วิวท่าเรือ",
    floorEn: "First floor",
    floorTh: "ชั้น 1",
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "mango-corner",
    slug: "mango-corner",
    shortKey: "garden",
    nameEn: "Mango Corner",
    nameTh: "Mango Corner",
    rate: 2300,
    ota: 2750,
    metaEn: "27 m² · Queen bed · Garden",
    metaTh: "27 ตร.ม. · เตียงควีน · สวน",
    descriptionEn:
      "Corner room under the mango canopy. Quiet evenings, birds at dawn, pool two doors down.",
    descriptionTh:
      "ห้องมุมใต้ต้นมะม่วง เย็นสงบ นกยามเช้า สระน้ำห่างสองประตู",
    photos: [
      unsplash("photo-1616594039964-ae9021a400a0"),
      unsplash("photo-1590490359683-658d3d23f972"),
      unsplash("photo-1586023492125-27b2c045efd7"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "coffee",
      "courtyard",
      "blackout",
      "housekeeping",
      "breakfast",
      "desk24",
    ],
    capacity: 2,
    bedTypeEn: "Queen bed",
    bedTypeTh: "เตียงควีน",
    sizeM2: 27,
    viewEn: "Garden",
    viewTh: "สวน",
    floorEn: "Ground floor",
    floorTh: "ชั้นล่าง",
    bathtub: false,
    balcony: false,
    pets: true,
    active: true,
  },
  {
    id: "captains-cabin",
    slug: "captains-cabin",
    shortKey: "suite",
    nameEn: "Captain's Cabin",
    nameTh: "Captain's Cabin",
    rate: 3500,
    ota: 4200,
    metaEn: "38 m² · King bed · River angle",
    metaTh: "38 ตร.ม. · เตียงคิง · มุมแม่น้ำ",
    descriptionEn:
      "Angled river windows, writing desk, and teak walls from the trading-house era.",
    descriptionTh:
      "หน้าต่างมุมแม่น้ำ โต๊ะเขียนหนังสือ และผนังไม้สักจากยุคบ้านค้าขาย",
    photos: [
      unsplash("photo-1618221195710-dd6b41faaea6"),
      unsplash("photo-1600210492486-724fe5c67fb0"),
      unsplash("photo-1600607687939-ce8a6c25118c"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "robe",
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
    bedTypeEn: "King bed",
    bedTypeTh: "เตียงคิง",
    sizeM2: 38,
    viewEn: "River angle",
    viewTh: "มุมแม่น้ำ",
    floorEn: "Second floor",
    floorTh: "ชั้น 2",
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "family-annex",
    slug: "family-annex",
    shortKey: "twin",
    nameEn: "Family Annex",
    nameTh: "Family Annex",
    rate: 4200,
    ota: 5050,
    metaEn: "48 m² · King + sofa · Courtyard",
    metaTh: "48 ตร.ม. · คิง + โซฟา · คอร์ทยาร์ด",
    descriptionEn:
      "Extra space for families: king bed, sofa bed, and a courtyard door for little feet.",
    descriptionTh:
      "พื้นที่พิเศษสำหรับครอบครัว เตียงคิง โซฟาเบด และประตูคอร์ทยาร์ดสำหรับเด็ก",
    photos: [
      unsplash("photo-1595526114035-0d45ed16c565"),
      unsplash("photo-1560448204-603b3fc33ddc"),
      unsplash("photo-1505691723518-36a5ac3be353"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "coffee",
      "courtyard",
      "blackout",
      "housekeeping",
      "breakfast",
      "transfer",
      "desk24",
    ],
    capacity: 4,
    bedTypeEn: "King + sofa bed",
    bedTypeTh: "คิง + โซฟาเบด",
    sizeM2: 48,
    viewEn: "Courtyard",
    viewTh: "คอร์ทยาร์ด",
    floorEn: "Ground floor",
    floorTh: "ชั้นล่าง",
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "attic-nook",
    slug: "attic-nook",
    shortKey: "twin",
    nameEn: "Attic Nook",
    nameTh: "Attic Nook",
    rate: 1900,
    ota: 2300,
    metaEn: "22 m² · Twin beds · Roofline",
    metaTh: "22 ตร.ม. · เตียงแฝด · ใต้หลังคา",
    descriptionEn:
      "Compact twin under the eaves. Perfect for friends sharing a short Bangkok stop.",
    descriptionTh:
      "ห้องแฝดกะทัดรัดใต้ชายคา เหมาะกับเพื่อนแวะพักกรุงเทพฯ สั้นๆ",
    photos: [
      unsplash("photo-1522771739844-47449f1b1172"),
      unsplash("photo-1484101403633-562f891dc89a"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "coffee",
      "desk",
      "blackout",
      "housekeeping",
      "breakfast",
      "desk24",
    ],
    capacity: 2,
    bedTypeEn: "2 single beds",
    bedTypeTh: "เตียงเดี่ยว 2",
    sizeM2: 22,
    viewEn: "Roofline",
    viewTh: "ใต้หลังคา",
    floorEn: "Attic",
    floorTh: "ชั้นใต้หลังคา",
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
  {
    id: "poolside-hide",
    slug: "poolside-hide",
    shortKey: "garden",
    nameEn: "Poolside Hide",
    nameTh: "Poolside Hide",
    rate: 2600,
    ota: 3120,
    metaEn: "29 m² · Queen bed · Pool",
    metaTh: "29 ตร.ม. · เตียงควีน · สระน้ำ",
    descriptionEn:
      "Steps from the saltwater pool. Cool tiles, shaded terrace, afternoon dips between meetings.",
    descriptionTh:
      "ห่างสระน้ำเกลือไม่กี่ก้าว กระเบื้องเย็น ระเบียงร่มรื่น แช่น้ำบ่ายระหว่างงาน",
    photos: [
      unsplash("photo-1571008887538-b36bb74556e6"),
      unsplash("photo-1584132915807-fd1f5fbc076f"),
      unsplash("photo-1578683010236-d716f9a3f461"),
    ],
    amenities: [
      "aircon",
      "wifi",
      "tv",
      "shower",
      "coffee",
      "courtyard",
      "blackout",
      "housekeeping",
      "breakfast",
      "desk24",
    ],
    capacity: 2,
    bedTypeEn: "Queen bed",
    bedTypeTh: "เตียงควีน",
    sizeM2: 29,
    viewEn: "Pool",
    viewTh: "สระน้ำ",
    floorEn: "Ground floor",
    floorTh: "ชั้นล่าง",
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  },
];

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

export async function seedDatabase() {
  console.log("Seeding TEAK HOUSE v8…");

  await prisma.guestBooking.deleteMany();
  await prisma.roomBlock.deleteMany();
  await prisma.seasonalPriceRule.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.demoMeta.deleteMany();
  await prisma.diningItem.deleteMany();
  await prisma.diningCategory.deleteMany();
  // v14 · seat requests point at events, so they go first. Table reservations
  // and contact messages are guest-generated demo traffic · the reseed clears
  // them too, so the sandbox starts each hour from the same known state.
  await prisma.eventRequest.deleteMany();
  await prisma.hotelEvent.deleteMany();
  await prisma.tableReservation.deleteMany();
  await prisma.contactMessage.deleteMany();

  await prisma.hotel.create({
    data: {
      id: "default",
      name: "The Teak House",
      tagline: "Riverside Boutique Hotel · Bangkok",
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
      petsPolicy: "Pets welcome in Garden Room and Mango Corner (fee applies).",
      depositPct: 30,
    },
  });

  for (const r of ROOMS) {
    await prisma.room.create({
      data: {
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
      },
    });
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const seededRules = ROOMS.flatMap((r) => seedRateRules(r.id, today));
  await prisma.seasonalPriceRule.createMany({ data: seededRules });

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
  for (let i = 0; i < bookingSpecs.length; i++) {
    const spec = bookingSpecs[i];
    const room = ROOMS[i % ROOMS.length];
    const g = GUESTS[i % GUESTS.length];
    const checkIn = iso(addDays(today, spec.offsetIn));
    const checkOut = iso(addDays(today, spec.offsetIn + spec.nights));
    const source = sources[i % sources.length];
    const status = spec.statusPool[i % spec.statusPool.length];
    const nights = nightsBetween(checkIn, checkOut);
    // Priced the same way the booking engine prices a live stay · so the
    // owner dashboard's revenue matches what the rate calendar says.
    const amount = quoteStay(
      room.rate,
      checkIn,
      checkOut,
      rateRulesByRoom[room.id] ?? []
    ).total;
    const id = `bk-${4300 + i}`;
    const prefix = source === "Direct" ? "TKH" : source === "Agoda" ? "AGD" : "BKG";
    const code = `${prefix}-${codeN++}`;

    await prisma.booking.create({
      data: {
        id,
        hotelId: "default",
        code,
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
      },
    });

    await prisma.guest.upsert({
      where: { id: `guest-${g.email}` },
      create: {
        id: `guest-${g.email}`,
        name: g.guest,
        email: g.email,
        phone: g.phone,
        nationality: g.nationality,
      },
      update: {
        name: g.guest,
        phone: g.phone,
      },
    });
  }

  await prisma.emailTemplate.create({
    data: {
      hotelId: "default",
      key: "booking_confirmation",
      subject: "Your stay at {{hotelName}} · {{code}}",
      body: "Dear {{guestName}},\n\nThank you for booking {{roomName}} from {{checkIn}} to {{checkOut}}.\nTotal: {{amount}}\nDeposit received: {{deposit}}\n\nSee you by the river.\n{{hotelName}}",
    },
  });

  await prisma.demoMeta.create({
    data: { id: "demo", lastReset: new Date() },
  });

  // Demo guest account linked to two bookings
  await prisma.user.create({
    data: {
      id: "gu-demo",
      name: "Demo Guest",
      email: "guest@teakhouse.demo",
      password: "demo1234",
      bookings: {
        create: [{ bookingId: "bk-4300" }, { bookingId: "bk-4315" }],
      },
    },
  });

  // v12 · dining menu · *Th columns mirror EN pending the Thai pass
  let dishCount = 0;
  for (let c = 0; c < DINING.length; c++) {
    const cat = DINING[c];
    await prisma.diningCategory.create({
      data: {
        id: cat.id,
        hotelId: "default",
        nameEn: cat.name,
        nameTh: DINING_TH[cat.id]?.name ?? cat.name,
        order: c,
        published: true,
        items: {
          create: cat.dishes.map((d, i) => ({
            id: `${cat.id}-i${i + 1}`,
            nameEn: d.name,
            nameTh: DINING_TH[cat.id]?.dishes[i]?.name ?? d.name,
            descriptionEn: d.description,
            descriptionTh:
              DINING_TH[cat.id]?.dishes[i]?.description ?? d.description,
            price: d.price,
            order: i,
            published: true,
          })),
        },
      },
    });
    dishCount += cat.dishes.length;
  }

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
  for (const ev of EVENTS) {
    await prisma.hotelEvent.create({
      data: {
        id: ev.id,
        hotelId: "default",
        titleEn: ev.title,
        titleTh: EVENTS_TH[ev.id]?.title ?? ev.title,
        date: ev.date,
        descriptionEn: ev.description,
        descriptionTh: EVENTS_TH[ev.id]?.description ?? ev.description,
        image: ev.image,
        published: true,
      },
    });
  }

  console.log(
    `Done · ${ROOMS.length} rooms · ${bookingSpecs.length} bookings · ${DINING.length} dining categories · ${dishCount} dishes · ${EVENTS.length} events · guests + demo user`
  );
}
