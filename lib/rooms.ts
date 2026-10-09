import type { AmenityId } from "./amenities";
import { formatBaht } from "./utils";

/**
 * The room catalogue · the ONE source of room content (v17 A4, the five-star
 * catalogue). Guest pages, the room pages and the /book flow all read their
 * names, words, photographs, sizes, beds, views, inclusions and amenities from
 * here, in English and Thai (the other languages fall back to English until
 * phase 3).
 *
 * The database holds only what the house operates: the live rate, the OTA
 * reference rate, whether a room type is on sale, rate rules and inventory,
 * all keyed by slug, and it is seeded from this file (lib/seedDatabase.ts).
 * A database that does not know a slug yet (a read-only preview that still
 * holds the old rooms) is never a problem: content always comes from here and
 * the price falls back to the base rate below (lib/liveRooms.ts).
 */

export type Bilingual = { en: string; th: string };

export const ROOM_SLUGS = [
  "deluxe-king",
  "deluxe-twin",
  "premier-river",
  "junior-suite",
  "teak-suite",
  "royal-teak-suite",
] as const;

export type RoomSlug = (typeof ROOM_SLUGS)[number];

export type RoomShortKey = "king" | "twin" | "river" | "junior" | "teak" | "royal";

/** A photograph of the room · a registry id (lib/images.ts) and its words. */
export type RoomImage = { id: string; alt: Bilingual };

export type CatalogueRoom = {
  slug: RoomSlug;
  shortKey: RoomShortKey;
  name: Bilingual;
  /** One calm line under the name: "40 m² · City view · King bed". */
  summary: Bilingual;
  /** The opening sentence on cards. */
  intro: Bilingual;
  /** The room page's paragraph. */
  description: Bilingual;
  sizeM2: number;
  view: Bilingual;
  beds: Bilingual;
  floor: Bilingual;
  /** Adults and children together (the booking bar's guest count). */
  capacity: number;
  /** How many rooms of this type the hotel has. */
  units: number;
  /** Base nightly rate in THB, before any rate rule. */
  rate: number;
  /** The same night on the booking sites, for the direct-saving line. */
  ota: number;
  /** Cover first; every photograph shows this room type and nothing else. */
  images: RoomImage[];
  /** Three or four short facts the cards and the dock can show. */
  highlights: Bilingual[];
  /** What a direct booking of this room includes. */
  inclusions: Bilingual[];
  amenities: AmenityId[];
  bathtub: boolean;
  balcony: boolean;
};

const BASE_AMENITIES: AmenityId[] = [
  "aircon",
  "wifi",
  "tv",
  "shower",
  "robe",
  "dryer",
  "safe",
  "minibar",
  "coffee",
  "blackout",
  "housekeeping",
  "breakfast",
  "transfer",
  "desk24",
];

const INCLUDED_EVERYWHERE: Bilingual[] = [
  { en: "Breakfast for two at the river terrace", th: "อาหารเช้าสำหรับสองท่านที่ระเบียงริมแม่น้ำ" },
  { en: "Free cancellation up to 3 days before arrival", th: "ยกเลิกฟรีก่อนวันเข้าพัก 3 วัน" },
  { en: "Late check-out until 2 pm, when the room allows", th: "เช็คเอาท์ล่าช้าได้ถึง 14:00 น. หากห้องว่าง" },
];

export const ROOM_CATALOGUE: CatalogueRoom[] = [
  {
    slug: "deluxe-king",
    shortKey: "king",
    name: { en: "Deluxe King", th: "ดีลักซ์ คิง" },
    summary: { en: "40 m² · City view · King bed", th: "40 ตร.ม. · วิวเมือง · เตียงคิงไซส์" },
    intro: {
      en: "Light, quiet and generous, with the skyline framed in floor-to-ceiling glass.",
      th: "ห้องพักสว่าง เงียบสงบ และกว้างขวาง พร้อมเส้นขอบฟ้าของเมืองผ่านกระจกสูงจรดเพดาน",
    },
    description: {
      en: "A calm room on the city side of the hotel. The king bed is dressed in Thai cotton against a walnut and oak headboard wall, two armchairs wait by the window, and the travertine bathroom has a freestanding tub beside a walk-in rain shower.",
      th: "ห้องพักอันเงียบสงบฝั่งวิวเมือง เตียงคิงไซส์ปูด้วยผ้าฝ้ายไทย ตัดกับผนังหัวเตียงไม้วอลนัทและโอ๊ก อาร์มแชร์สองตัวรออยู่ริมหน้าต่าง และห้องน้ำหินทราเวอร์ทีนมีอ่างอาบน้ำแบบตั้งอิสระคู่กับฝักบัวเรนชาวเวอร์แบบวอล์กอิน",
    },
    sizeM2: 40,
    view: { en: "City view", th: "วิวเมือง" },
    beds: { en: "One king bed", th: "เตียงคิงไซส์ 1 เตียง" },
    floor: { en: "Floors 6 to 14", th: "ชั้น 6 ถึง 14" },
    capacity: 2,
    units: 48,
    rate: 6900,
    ota: 7900,
    images: [
      {
        id: "room-deluxe-king",
        alt: {
          en: "The Deluxe King: a king bed on a walnut frame against an oak headboard wall",
          th: "ห้องดีลักซ์ คิง เตียงคิงไซส์โครงไม้วอลนัทหน้าผนังหัวเตียงไม้โอ๊ก",
        },
      },
      {
        id: "room-deluxe-king-bath",
        alt: {
          en: "A travertine bathroom with a walk-in glass shower and a freestanding tub",
          th: "ห้องน้ำหินทราเวอร์ทีน ฝักบัวกระจกแบบวอล์กอินและอ่างอาบน้ำแบบตั้งอิสระ",
        },
      },
      {
        id: "room-deluxe-king-view",
        alt: {
          en: "Two cream armchairs facing a tall window over the city",
          th: "อาร์มแชร์สีครีมสองตัวหันสู่หน้าต่างบานสูงที่มองเห็นเมือง",
        },
      },
      {
        id: "room-deluxe-king-detail",
        alt: {
          en: "A walnut nightstand with a marble top and a copper reading lamp",
          th: "โต๊ะข้างเตียงไม้วอลนัทท็อปหินอ่อนกับโคมไฟอ่านหนังสือสีทองแดง",
        },
      },
    ],
    highlights: [
      { en: "Floor-to-ceiling windows", th: "หน้าต่างสูงจรดเพดาน" },
      { en: "Travertine bathroom with soaking tub", th: "ห้องน้ำหินทราเวอร์ทีนพร้อมอ่างแช่ตัว" },
      { en: "Reading corner by the window", th: "มุมนั่งอ่านหนังสือริมหน้าต่าง" },
    ],
    inclusions: INCLUDED_EVERYWHERE,
    amenities: [...BASE_AMENITIES, "bathtub", "desk"],
    bathtub: true,
    balcony: false,
  },
  {
    slug: "deluxe-twin",
    shortKey: "twin",
    name: { en: "Deluxe Twin", th: "ดีลักซ์ ทวิน" },
    summary: { en: "40 m² · Garden view · Two queen beds", th: "40 ตร.ม. · วิวสวน · เตียงควีนไซส์ 2 เตียง" },
    intro: {
      en: "Two queen beds and tall glass doors onto the hotel's tropical garden.",
      th: "เตียงควีนไซส์สองเตียงกับประตูกระจกบานสูงที่เปิดสู่สวนเขตร้อนของโรงแรม",
    },
    description: {
      en: "Made for friends and families who like their own bed. Two queen beds face tall windows and glass doors full of tropical green, with a sage armchair in the corner for the first coffee of the day. The bathroom pairs white tile with a teak vanity.",
      th: "ออกแบบมาสำหรับเพื่อนและครอบครัวที่ชอบมีเตียงเป็นของตัวเอง เตียงควีนไซส์สองเตียงหันสู่หน้าต่างและประตูกระจกบานสูงที่เต็มไปด้วยสีเขียวของต้นปาล์ม มีอาร์มแชร์สีเขียวเสจตรงมุมห้องสำหรับกาแฟแก้วแรกของวัน ห้องน้ำตกแต่งด้วยกระเบื้องสีขาวและอ่างล้างหน้าบนเคาน์เตอร์ไม้สัก",
    },
    sizeM2: 40,
    view: { en: "Garden view", th: "วิวสวน" },
    beds: { en: "Two queen beds", th: "เตียงควีนไซส์ 2 เตียง" },
    floor: { en: "Floors 2 to 5", th: "ชั้น 2 ถึง 5" },
    capacity: 4,
    units: 36,
    rate: 6900,
    ota: 7900,
    images: [
      {
        id: "room-deluxe-twin",
        alt: {
          en: "The Deluxe Twin: two made beds beside tall windows and glass doors onto the garden",
          th: "ห้องดีลักซ์ ทวิน เตียงสองเตียงข้างหน้าต่างและประตูกระจกบานสูงที่เปิดสู่สวน",
        },
      },
      {
        id: "room-deluxe-twin-bath",
        alt: {
          en: "A white tiled bathroom with a round basin on a teak vanity",
          th: "ห้องน้ำกระเบื้องขาวกับอ่างล้างหน้าทรงกลมบนเคาน์เตอร์ไม้สัก",
        },
      },
      {
        id: "room-deluxe-twin-view",
        alt: {
          en: "A sage armchair and ottoman at a corner of tall windows looking onto palms",
          th: "อาร์มแชร์และที่วางเท้าสีเขียวเสจตรงมุมหน้าต่างบานสูงที่มองเห็นต้นปาล์ม",
        },
      },
      {
        id: "room-deluxe-twin-detail",
        alt: {
          en: "Coffee brewing through a glass pour-over beside small green plants",
          th: "กาแฟดริปในเหยือกแก้วข้างต้นไม้สีเขียวต้นเล็ก",
        },
      },
    ],
    highlights: [
      { en: "Two queen beds, sleeps four", th: "เตียงควีนไซส์สองเตียง พักได้ 4 ท่าน" },
      { en: "Glass doors onto the garden", th: "ประตูกระจกเปิดสู่สวน" },
      { en: "Teak and white-tile bathroom", th: "ห้องน้ำไม้สักและกระเบื้องขาว" },
    ],
    inclusions: INCLUDED_EVERYWHERE,
    amenities: [...BASE_AMENITIES, "courtyard", "desk"],
    bathtub: false,
    balcony: false,
  },
  {
    slug: "premier-river",
    shortKey: "river",
    name: { en: "Premier River View", th: "พรีเมียร์ ริเวอร์วิว" },
    summary: { en: "46 m² · River view · King bed", th: "46 ตร.ม. · วิวแม่น้ำ · เตียงคิงไซส์" },
    intro: {
      en: "A wall of sliding glass opens the room to the terrace and the river light.",
      th: "ผนังกระจกบานเลื่อนเปิดห้องสู่ระเบียงและแสงจากแม่น้ำ",
    },
    description: {
      en: "On the river side of the hotel, a wall of sliding glass runs the width of the room and opens onto a private terrace. The king bed faces the water; the bathroom places a freestanding tub under a tall window full of trees.",
      th: "ห้องพักฝั่งแม่น้ำที่มีผนังกระจกบานเลื่อนยาวตลอดความกว้างของห้อง เปิดออกสู่ระเบียงส่วนตัว เตียงคิงไซส์หันหน้าสู่สายน้ำ ส่วนห้องน้ำมีอ่างอาบน้ำแบบตั้งอิสระวางอยู่ใต้หน้าต่างบานสูงที่มองเห็นแมกไม้",
    },
    sizeM2: 46,
    view: { en: "River view", th: "วิวแม่น้ำ" },
    beds: { en: "One king bed", th: "เตียงคิงไซส์ 1 เตียง" },
    floor: { en: "Floors 8 to 18", th: "ชั้น 8 ถึง 18" },
    capacity: 3,
    units: 40,
    rate: 8900,
    ota: 10200,
    images: [
      {
        id: "room-premier-river",
        alt: {
          en: "The Premier River View: a white bed facing a wall of sliding glass onto the terrace",
          th: "ห้องพรีเมียร์ ริเวอร์วิว เตียงสีขาวหันสู่ผนังกระจกบานเลื่อนที่เปิดสู่ระเบียง",
        },
      },
      {
        id: "room-premier-river-bath",
        alt: {
          en: "A freestanding white tub under a tall window full of green trees",
          th: "อ่างอาบน้ำสีขาวแบบตั้งอิสระใต้หน้าต่างบานสูงที่เห็นต้นไม้เขียวขจี",
        },
      },
    ],
    highlights: [
      { en: "Private terrace over the river", th: "ระเบียงส่วนตัวเหนือแม่น้ำ" },
      { en: "Sliding glass wall", th: "ผนังกระจกบานเลื่อน" },
      { en: "Tub beneath a garden window", th: "อ่างอาบน้ำใต้หน้าต่างวิวสวน" },
    ],
    inclusions: INCLUDED_EVERYWHERE,
    amenities: [...BASE_AMENITIES, "bathtub", "balcony", "desk"],
    bathtub: true,
    balcony: true,
  },
  {
    slug: "junior-suite",
    shortKey: "junior",
    name: { en: "Junior Suite", th: "จูเนียร์สวีท" },
    summary: { en: "64 m² · River view · Separate lounge", th: "64 ตร.ม. · วิวแม่น้ำ · ห้องนั่งเล่นแยก" },
    intro: {
      en: "A bedroom and a separate lounge, and a sunlit deck above the water.",
      th: "ห้องนอนและห้องนั่งเล่นแยกเป็นสัดส่วน พร้อมดาดฟ้าไม้รับแดดเหนือสายน้ำ",
    },
    description: {
      en: "Space to spread out. Oak panelling and sheer curtains soften the bedroom; a separate lounge with a deep linen sofa looks out through full-height glass, and wicker chairs on the sunlit deck face the river. The marble bathroom has a double vanity and a freestanding tub.",
      th: "พื้นที่กว้างขวางให้คุณได้ผ่อนคลายเต็มที่ ห้องนอนตกแต่งด้วยผนังไม้โอ๊กและม่านโปร่งนุ่มนวล ห้องนั่งเล่นแยกพร้อมโซฟาผ้าลินินตัวใหญ่มองออกไปผ่านกระจกสูงจรดเพดาน และเก้าอี้หวายบนดาดฟ้ารับแดดหันหน้าสู่แม่น้ำ ห้องน้ำหินอ่อนมีอ่างล้างหน้าคู่และอ่างอาบน้ำแบบตั้งอิสระ",
    },
    sizeM2: 64,
    view: { en: "River view", th: "วิวแม่น้ำ" },
    beds: { en: "One king bed", th: "เตียงคิงไซส์ 1 เตียง" },
    floor: { en: "Floors 15 to 21", th: "ชั้น 15 ถึง 21" },
    capacity: 3,
    units: 18,
    rate: 13500,
    ota: 15400,
    images: [
      {
        id: "room-junior-suite",
        alt: {
          en: "The Junior Suite bedroom: an upholstered headboard, oak panelling and sheer curtains",
          th: "ห้องนอนจูเนียร์สวีท หัวเตียงบุผ้า ผนังไม้โอ๊ก และม่านโปร่ง",
        },
      },
      {
        id: "room-junior-suite-detail",
        alt: {
          en: "The separate lounge: a linen sofa and ottoman by full-height glass",
          th: "ห้องนั่งเล่นแยก โซฟาผ้าลินินและที่วางเท้าข้างกระจกสูงจรดเพดาน",
        },
      },
      {
        id: "room-junior-suite-view",
        alt: {
          en: "Wicker armchairs and a low table on a sunlit deck above calm water",
          th: "เก้าอี้หวายและโต๊ะเตี้ยบนดาดฟ้ารับแดดเหนือผืนน้ำสงบ",
        },
      },
      {
        id: "room-junior-suite-bath",
        alt: {
          en: "A bright bathroom with an oak double vanity, marble counter and freestanding tub",
          th: "ห้องน้ำสว่างพร้อมอ่างล้างหน้าคู่ไม้โอ๊ก เคาน์เตอร์หินอ่อน และอ่างอาบน้ำแบบตั้งอิสระ",
        },
      },
    ],
    highlights: [
      { en: "Separate lounge", th: "ห้องนั่งเล่นแยก" },
      { en: "Sun deck above the river", th: "ดาดฟ้ารับแดดเหนือแม่น้ำ" },
      { en: "Marble bathroom, double vanity", th: "ห้องน้ำหินอ่อน อ่างล้างหน้าคู่" },
    ],
    inclusions: [
      ...INCLUDED_EVERYWHERE,
      { en: "Club Lounge access with evening cocktails", th: "สิทธิ์ใช้คลับเลานจ์ พร้อมค็อกเทลยามเย็น" },
    ],
    amenities: [...BASE_AMENITIES, "bathtub", "lounge", "balcony", "speaker"],
    bathtub: true,
    balcony: true,
  },
  {
    slug: "teak-suite",
    shortKey: "teak",
    name: { en: "Teak Suite", th: "ทีคสวีท" },
    summary: { en: "92 m² · Wraparound river terrace", th: "92 ตร.ม. · ระเบียงโอบรอบริมแม่น้ำ" },
    intro: {
      en: "The house's signature: hand-laid teak, a stone tub and a terrace that wraps the corner.",
      th: "ห้องพักซิกเนเจอร์ของโรงแรม ไม้สักเรียงด้วยมือ อ่างหิน และระเบียงที่โอบรอบมุมอาคาร",
    },
    description: {
      en: "Our signature suite, finished in hand-laid teak. The king bed rests against a stacked teak wall, the stone soaking tub sits among tropical plants, and a wraparound terrace with a sunken garden lounge turns the corner of the building towards the river.",
      th: "สวีทซิกเนเจอร์ของเรา ตกแต่งด้วยไม้สักที่เรียงด้วยมือ เตียงคิงไซส์ตั้งชิดผนังไม้สักเรียงซ้อน อ่างแช่ตัวหินวางอยู่ท่ามกลางพรรณไม้เขตร้อน และระเบียงโอบรอบพร้อมเลานจ์สวนแบบลดระดับ ทอดตัวไปตามมุมอาคารสู่แม่น้ำ",
    },
    sizeM2: 92,
    view: { en: "River and garden", th: "วิวแม่น้ำและสวน" },
    beds: { en: "One king bed", th: "เตียงคิงไซส์ 1 เตียง" },
    floor: { en: "Corner suites, floors 18 to 22", th: "สวีทมุมอาคาร ชั้น 18 ถึง 22" },
    capacity: 3,
    units: 8,
    rate: 21000,
    ota: 24000,
    images: [
      {
        id: "room-teak-suite",
        alt: {
          en: "The Teak Suite: a king bed against a stacked teak headboard wall",
          th: "ห้องทีคสวีท เตียงคิงไซส์หน้าผนังหัวเตียงไม้สักเรียงซ้อน",
        },
      },
      {
        id: "room-teak-suite-view",
        alt: {
          en: "The terrace's sunken garden lounge with a timber table and cushioned stone benches",
          th: "เลานจ์สวนแบบลดระดับบนระเบียง โต๊ะไม้และม้านั่งหินพร้อมเบาะ",
        },
      },
      {
        id: "room-teak-suite-bath",
        alt: {
          en: "A stone soaking tub with a teak shelf and tropical plants",
          th: "อ่างแช่ตัวหินกับชั้นวางไม้สักและพรรณไม้เขตร้อน",
        },
      },
      {
        id: "room-teak-suite-detail",
        alt: {
          en: "A teak lounge chair with a woven cane seat in soft light",
          th: "เก้าอี้พักผ่อนไม้สักที่นั่งหวายสานในแสงนุ่ม",
        },
      },
    ],
    highlights: [
      { en: "Wraparound terrace", th: "ระเบียงโอบรอบห้อง" },
      { en: "Stone soaking tub", th: "อ่างแช่ตัวหิน" },
      { en: "Hand-laid teak throughout", th: "ไม้สักเรียงด้วยมือทั้งห้อง" },
    ],
    inclusions: [
      ...INCLUDED_EVERYWHERE,
      { en: "Club Lounge access with evening cocktails", th: "สิทธิ์ใช้คลับเลานจ์ พร้อมค็อกเทลยามเย็น" },
      { en: "Private airport arrival", th: "บริการรถรับจากสนามบินส่วนตัว" },
    ],
    amenities: [...BASE_AMENITIES, "bathtub", "terrace", "lounge", "speaker"],
    bathtub: true,
    balcony: true,
  },
  {
    slug: "royal-teak-suite",
    shortKey: "royal",
    name: { en: "Royal Teak Suite", th: "รอยัล ทีคสวีท" },
    summary: { en: "210 m² · Two bedrooms · Plunge-pool terrace", th: "210 ตร.ม. · 2 ห้องนอน · ระเบียงสระว่ายน้ำส่วนตัว" },
    intro: {
      en: "A residence above the river: two bedrooms, a dining room and a private pool.",
      th: "เรือนพักเหนือสายน้ำ สองห้องนอน ห้องรับประทานอาหาร และสระว่ายน้ำส่วนตัว",
    },
    description: {
      en: "The top of the house. Two bedrooms open off a long living and dining room with a timber table for six under rattan pendants; the main bedroom faces full-height glass and a marble bathroom with a freestanding tub. Outside, loungers and a parasol wait beside a private green-tiled plunge pool. A personal butler looks after the suite.",
      th: "ที่สุดของโรงแรม สองห้องนอนเชื่อมกับห้องนั่งเล่นและห้องรับประทานอาหารยาว โต๊ะไม้สำหรับหกท่านใต้โคมไฟหวาย ห้องนอนใหญ่หันสู่กระจกสูงจรดเพดานและห้องน้ำหินอ่อนพร้อมอ่างอาบน้ำแบบตั้งอิสระ ด้านนอกมีเก้าอี้อาบแดดและร่มรออยู่ข้างสระว่ายน้ำส่วนตัวปูกระเบื้องสีเขียว พร้อมบัตเลอร์ส่วนตัวดูแลตลอดการเข้าพัก",
    },
    sizeM2: 210,
    view: { en: "River and skyline", th: "วิวแม่น้ำและเส้นขอบฟ้า" },
    beds: { en: "Two bedrooms, two king beds", th: "2 ห้องนอน เตียงคิงไซส์ 2 เตียง" },
    floor: { en: "Top floor", th: "ชั้นบนสุด" },
    capacity: 4,
    units: 1,
    rate: 68000,
    ota: 76500,
    images: [
      {
        id: "room-royal-teak-suite",
        alt: {
          en: "The Royal Teak Suite main bedroom: a king bed on a teak base facing full-height glass",
          th: "ห้องนอนใหญ่รอยัล ทีคสวีท เตียงคิงไซส์ฐานไม้สักหันสู่กระจกสูงจรดเพดาน",
        },
      },
      {
        id: "room-royal-teak-suite-view",
        alt: {
          en: "Loungers and a parasol beside the suite's private green-tiled plunge pool",
          th: "เก้าอี้อาบแดดและร่มข้างสระว่ายน้ำส่วนตัวปูกระเบื้องสีเขียวของสวีท",
        },
      },
      {
        id: "room-royal-teak-suite-detail",
        alt: {
          en: "The dining room: a long timber table with woven chairs under rattan pendants",
          th: "ห้องรับประทานอาหาร โต๊ะไม้ยาวกับเก้าอี้สานใต้โคมไฟหวาย",
        },
      },
      {
        id: "room-royal-teak-suite-bath",
        alt: {
          en: "A freestanding white tub on marble beneath a tall window with sheer curtains",
          th: "อ่างอาบน้ำสีขาวแบบตั้งอิสระบนพื้นหินอ่อนใต้หน้าต่างบานสูงกับม่านโปร่ง",
        },
      },
    ],
    highlights: [
      { en: "Private plunge pool", th: "สระว่ายน้ำส่วนตัว" },
      { en: "Two bedrooms, dining for six", th: "2 ห้องนอน ห้องอาหารสำหรับ 6 ท่าน" },
      { en: "Personal butler", th: "บัตเลอร์ส่วนตัว" },
    ],
    inclusions: [
      ...INCLUDED_EVERYWHERE,
      { en: "Club Lounge access with evening cocktails", th: "สิทธิ์ใช้คลับเลานจ์ พร้อมค็อกเทลยามเย็น" },
      { en: "Private airport transfers both ways", th: "บริการรถรับส่งสนามบินส่วนตัวไปกลับ" },
      { en: "Personal butler throughout your stay", th: "บัตเลอร์ส่วนตัวดูแลตลอดการเข้าพัก" },
    ],
    amenities: [...BASE_AMENITIES, "bathtub", "terrace", "lounge", "plunge", "dining", "butler", "speaker"],
    bathtub: true,
    balcony: true,
  },
];

const BY_SLUG = new Map<string, CatalogueRoom>(ROOM_CATALOGUE.map((r) => [r.slug, r]));

export const SHORT_KEY_TO_SLUG: Record<RoomShortKey, RoomSlug> = {
  king: "deluxe-king",
  twin: "deluxe-twin",
  river: "premier-river",
  junior: "junior-suite",
  teak: "teak-suite",
  royal: "royal-teak-suite",
};

export function catalogueRoom(slugOrKey: string | null | undefined): CatalogueRoom | undefined {
  if (!slugOrKey) return undefined;
  return BY_SLUG.get(slugOrKey) ?? BY_SLUG.get(SHORT_KEY_TO_SLUG[slugOrKey as RoomShortKey] ?? "");
}

/** The lowest base rate in the catalogue · "from ฿6,900". */
export const CATALOGUE_FROM_RATE = Math.min(...ROOM_CATALOGUE.map((r) => r.rate));

/* ── The database shape (owner panel, API, seed) ─────────────────────────── */

/**
 * A room as the database and the owner panel hold it. The guest site does not
 * read its words or photographs (the catalogue above does); it reads `rate`,
 * `ota`, `active` and `id` from it by slug.
 */
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

/** The catalogue as database rows · what the seed writes and the owner panel starts from. */
export function catalogueAsRooms(): Room[] {
  return ROOM_CATALOGUE.map((r) => ({
    id: r.slug,
    slug: r.slug,
    shortKey: r.shortKey,
    name: r.name,
    rate: r.rate,
    ota: r.ota,
    meta: r.summary,
    description: r.description,
    // The seed writes the real image URLs (lib/seedDatabase, via the
    // registry); this client-safe copy stays free of the registry.
    photos: [],
    amenities: r.amenities,
    capacity: r.capacity,
    bedType: r.beds,
    sizeM2: r.sizeM2,
    view: r.view,
    floor: r.floor,
    bathtub: r.bathtub,
    balcony: r.balcony,
    pets: false,
    active: true,
  }));
}

export const SEED_ROOMS: Room[] = catalogueAsRooms();

export function getRoomBySlug(slug: string): Room | undefined {
  return SEED_ROOMS.find((room) => room.slug === slug);
}

export function getRoomByKey(key: string): Room | undefined {
  const slug = SHORT_KEY_TO_SLUG[key as RoomShortKey] ?? key;
  return getRoomBySlug(slug);
}

export { formatBaht };
