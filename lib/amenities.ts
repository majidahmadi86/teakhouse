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
  | "desk24";

export type Amenity = {
  id: AmenityId;
  icon: string;
  group: AmenityGroup;
  en: string;
  th: string;
};

export const AMENITIES: Record<AmenityId, Amenity> = {
  aircon: {
    id: "aircon",
    icon: "air-vent",
    group: "room",
    en: "Air conditioning",
    th: "เครื่องปรับอากาศ",
  },
  wifi: {
    id: "wifi",
    icon: "wifi",
    group: "room",
    en: "Fast Wi-Fi",
    th: "Wi-Fi ความเร็วสูง",
  },
  tv: {
    id: "tv",
    icon: "tv",
    group: "room",
    en: '55" smart TV',
    th: "สมาร์ททีวี 55 นิ้ว",
  },
  shower: {
    id: "shower",
    icon: "shower-head",
    group: "bathroom",
    en: "Rain shower",
    th: "ฝักบัวเรนชาวเวอร์",
  },
  bathtub: {
    id: "bathtub",
    icon: "bath",
    group: "bathroom",
    en: "Soaking bathtub",
    th: "อ่างแช่ตัว",
  },
  robe: {
    id: "robe",
    icon: "shirt",
    group: "bathroom",
    en: "Bathrobes + slippers",
    th: "เสื้อคลุมอาบน้ำและรองเท้าแตะ",
  },
  dryer: {
    id: "dryer",
    icon: "wind",
    group: "bathroom",
    en: "Hair dryer",
    th: "ไดร์เป่าผม",
  },
  safe: {
    id: "safe",
    icon: "lock",
    group: "room",
    en: "In-room safe",
    th: "ตู้เซฟในห้อง",
  },
  minibar: {
    id: "minibar",
    icon: "wine",
    group: "room",
    en: "Minibar",
    th: "มินิบาร์",
  },
  coffee: {
    id: "coffee",
    icon: "coffee",
    group: "room",
    en: "Coffee + tea set",
    th: "ชุดกาแฟและชา",
  },
  desk: {
    id: "desk",
    icon: "lamp-desk",
    group: "room",
    en: "Writing desk",
    th: "โต๊ะทำงาน",
  },
  balcony: {
    id: "balcony",
    icon: "waves",
    group: "room",
    en: "River balcony",
    th: "ระเบียงริมแม่น้ำ",
  },
  courtyard: {
    id: "courtyard",
    icon: "trees",
    group: "room",
    en: "Courtyard view",
    th: "วิวคอร์ทยาร์ด",
  },
  blackout: {
    id: "blackout",
    icon: "moon",
    group: "comfort",
    en: "Blackout curtains",
    th: "ผ้าม่านทึบแสง",
  },
  housekeeping: {
    id: "housekeeping",
    icon: "sparkles",
    group: "services",
    en: "Daily housekeeping",
    th: "ทำความสะอาดทุกวัน",
  },
  breakfast: {
    id: "breakfast",
    icon: "croissant",
    group: "services",
    en: "Breakfast included",
    th: "รวมอาหารเช้า",
  },
  transfer: {
    id: "transfer",
    icon: "car",
    group: "services",
    en: "Airport transfer bookable",
    th: "จองรถรับสนามบินได้",
  },
  desk24: {
    id: "desk24",
    icon: "bell",
    group: "services",
    en: "24-hour desk",
    th: "ฟรอนต์ 24 ชั่วโมง",
  },
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
