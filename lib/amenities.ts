export type AmenityGroup = "room" | "bathroom" | "comfort" | "services";

export type AmenityId =
  | "aircon"
  | "wifi"
  | "tv"
  | "shower"
  | "bathtub"
  | "robe"
  | "dryer"
  | "safe"
  | "minibar"
  | "coffee"
  | "desk"
  | "balcony"
  | "courtyard"
  | "blackout"
  | "housekeeping"
  | "breakfast"
  | "transfer"
  | "desk24"
  | "terrace"
  | "lounge"
  | "plunge"
  | "butler"
  | "dining"
  | "speaker";

export type Amenity = {
  id: AmenityId;
  icon: string;
  group: AmenityGroup;
  en: string;
  th: string;
};

/**
 * In-room amenities · written to a five-star standard (v17 A4). Guest pages
 * list them as calm text grouped by section, never as an icon row; the owner
 * panel keeps its icons.
 */
export const AMENITIES: Record<AmenityId, Amenity> = {
  aircon: { id: "aircon", icon: "air-vent", group: "comfort", en: "Quiet individual climate control", th: "ระบบปรับอากาศแยกควบคุม เงียบสนิท" },
  wifi: { id: "wifi", icon: "wifi", group: "room", en: "Complimentary high-speed Wi-Fi", th: "Wi-Fi ความเร็วสูงไม่มีค่าใช้จ่าย" },
  tv: { id: "tv", icon: "tv", group: "room", en: "65-inch screen with casting", th: "จอ 65 นิ้ว รองรับการแคสต์จากมือถือ" },
  shower: { id: "shower", icon: "shower-head", group: "bathroom", en: "Walk-in rain shower", th: "ฝักบัวเรนชาวเวอร์แบบวอล์กอิน" },
  bathtub: { id: "bathtub", icon: "bath", group: "bathroom", en: "Freestanding soaking tub", th: "อ่างแช่ตัวแบบตั้งอิสระ" },
  robe: { id: "robe", icon: "shirt", group: "bathroom", en: "Cotton robes and slippers", th: "เสื้อคลุมอาบน้ำผ้าฝ้ายและรองเท้าแตะ" },
  dryer: { id: "dryer", icon: "wind", group: "bathroom", en: "Professional hair dryer", th: "ไดร์เป่าผมระดับมืออาชีพ" },
  safe: { id: "safe", icon: "lock", group: "room", en: "Laptop-size safe", th: "ตู้เซฟขนาดใส่แล็ปท็อปได้" },
  minibar: { id: "minibar", icon: "wine", group: "room", en: "Curated minibar, soft drinks on the house", th: "มินิบาร์คัดสรร เครื่องดื่มไม่มีแอลกอฮอล์ไม่มีค่าใช้จ่าย" },
  coffee: { id: "coffee", icon: "coffee", group: "room", en: "Espresso machine and Thai teas", th: "เครื่องชงเอสเปรสโซและชาไทยคัดสรร" },
  desk: { id: "desk", icon: "lamp-desk", group: "room", en: "Writing desk", th: "โต๊ะเขียนหนังสือ" },
  balcony: { id: "balcony", icon: "waves", group: "room", en: "Private river balcony", th: "ระเบียงส่วนตัวริมแม่น้ำ" },
  courtyard: { id: "courtyard", icon: "trees", group: "room", en: "Garden outlook", th: "วิวสวน" },
  blackout: { id: "blackout", icon: "moon", group: "comfort", en: "Blackout drapes and sheers", th: "ม่านทึบแสงและม่านโปร่ง" },
  housekeeping: { id: "housekeeping", icon: "sparkles", group: "services", en: "Twice-daily housekeeping with turndown", th: "ทำความสะอาดวันละสองครั้ง พร้อมบริการเตรียมห้องก่อนนอน" },
  breakfast: { id: "breakfast", icon: "croissant", group: "services", en: "Breakfast for two at the river terrace", th: "อาหารเช้าสำหรับสองท่านที่ระเบียงริมแม่น้ำ" },
  transfer: { id: "transfer", icon: "car", group: "services", en: "Airport transfer on request", th: "บริการรถรับส่งสนามบินตามคำขอ" },
  desk24: { id: "desk24", icon: "bell", group: "services", en: "24-hour concierge", th: "คอนเซียร์จตลอด 24 ชั่วโมง" },
  terrace: { id: "terrace", icon: "waves", group: "room", en: "Wraparound river terrace", th: "ระเบียงโอบรอบห้องริมแม่น้ำ" },
  lounge: { id: "lounge", icon: "sparkles", group: "room", en: "Separate living room", th: "ห้องนั่งเล่นแยกเป็นสัดส่วน" },
  plunge: { id: "plunge", icon: "waves", group: "room", en: "Private plunge pool", th: "สระว่ายน้ำส่วนตัว" },
  butler: { id: "butler", icon: "bell", group: "services", en: "Personal butler", th: "บัตเลอร์ส่วนตัว" },
  dining: { id: "dining", icon: "sparkles", group: "room", en: "Dining room for six", th: "ห้องรับประทานอาหารสำหรับหกท่าน" },
  speaker: { id: "speaker", icon: "sparkles", group: "comfort", en: "Bluetooth sound system", th: "ระบบเสียงบลูทูธ" },
};

export const SECTION_LABELS: Record<
  AmenityGroup,
  { en: string; th: string }
> = {
  room: { en: "Room", th: "ห้องพัก" },
  bathroom: { en: "Bathroom", th: "ห้องน้ำ" },
  comfort: { en: "Comfort", th: "ความสบาย" },
  services: { en: "Services", th: "บริการ" },
};
