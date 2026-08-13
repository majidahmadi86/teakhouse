import type { Metadata } from "next";
import { hotelConfig } from "@/config/hotel.config";
import { getServerLocale } from "@/lib/serverLocale";
import type { DictEntry } from "@/lib/i18n-dict";
import type { Lang } from "@/lib/i18n";

/**
 * Per-route title and description, in both languages.
 *
 * Deliberately NOT in lib/i18n-dict · that dictionary is imported by the client
 * i18n provider, so everything in it ships to every browser. These strings are
 * read by search engines and share-preview crawlers and are never painted on
 * screen, so they stay server-side.
 *
 * The Thai is written for Thai search, not transliterated from the English ·
 * the words a Thai guest would actually type. Brand names stay Latin.
 */
type RouteMeta = { title: DictEntry; description?: DictEntry };

export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: {
      en: "The Teak House · Riverside Boutique Hotel Bangkok · Demo by Mikaro Studio",
      th: "The Teak House · โรงแรมบูทีคริมแม่น้ำ กรุงเทพ · เดโมโดย Mikaro Studio",
    },
    description: {
      en: "Direct-booking demo hotel: live availability with deposits, 24/7 bilingual AI concierge, and an owner dashboard. A showcase system by Mikaro Studio, Bangkok.",
      th: "เดโมระบบจองตรง · ดูห้องว่างจริงพร้อมมัดจำ ผู้ช่วยตอบแชทสองภาษาตลอด 24 ชั่วโมง และระบบหลังบ้านสำหรับเจ้าของที่พัก โดย Mikaro Studio กรุงเทพ",
    },
  },
  "/rooms": {
    title: { en: "Rooms", th: "ห้องพัก" },
    description: {
      en: "Ten teak rooms and suites on the Chao Phraya, from river lofts to a garden room · rates, photos and what every stay includes.",
      th: "ห้องพักและสวีทไม้สักสิบห้องริมแม่น้ำเจ้าพระยา ตั้งแต่ห้องลอฟต์วิวแม่น้ำถึงห้องริมสวน ดูราคา ภาพถ่าย และสิ่งที่รวมอยู่ในทุกการเข้าพัก",
    },
  },
  "/book": {
    title: { en: "Book Direct", th: "จองตรงกับเรา" },
    description: {
      en: "Check live availability, pay a deposit, and confirm your teak room · direct booking demo by Mikaro Studio.",
      th: "เช็คห้องว่างตามจริง วางมัดจำ และยืนยันห้องไม้สักของคุณได้ทันที · เดโมระบบจองตรงโดย Mikaro Studio",
    },
  },
  "/dining": {
    title: { en: "Dining", th: "ห้องอาหาร" },
    description: {
      en: "Breakfast on the river pier, a Thai kitchen and drinks at sundown at The Teak House · a riverside boutique demo by Mikaro Studio.",
      th: "อาหารเช้าริมท่าเรือ ครัวไทย และเครื่องดื่มยามพระอาทิตย์ตกที่ The Teak House · เดโมโรงแรมบูทีคริมแม่น้ำโดย Mikaro Studio",
    },
  },
  "/dining/reserve": {
    title: { en: "Reserve a table", th: "จองโต๊ะ" },
    description: {
      en: "Reserve a table at The Teak House riverside kitchen · pick a date, a time and a party size, no deposit required. A demo by Mikaro Studio.",
      th: "จองโต๊ะที่ครัวริมแม่น้ำของ The Teak House · เลือกวัน เวลา และจำนวนท่าน ไม่ต้องวางมัดจำ · เดโมโดย Mikaro Studio",
    },
  },
  "/events": {
    title: { en: "Events & Spaces", th: "งานอีเวนต์และสถานที่" },
    description: {
      en: "A riverside teak pavilion for weddings, private dinners and parties, plus special evenings on the house calendar at The Teak House · a demo by Mikaro Studio.",
      th: "ศาลาไม้สักริมแม่น้ำสำหรับงานแต่งงาน มื้อค่ำส่วนตัว และงานเลี้ยง พร้อมค่ำคืนพิเศษตามปฏิทินของ The Teak House · เดโมโดย Mikaro Studio",
    },
  },
  "/events/reserve": {
    title: { en: "Reserve seats", th: "จองที่นั่ง" },
    description: {
      en: "Request seats at a special evening on the house calendar at The Teak House · no payment, the house confirms. A demo by Mikaro Studio.",
      th: "ขอจองที่นั่งในค่ำคืนพิเศษตามปฏิทินของ The Teak House · ไม่ต้องชำระเงิน ทางโรงแรมจะยืนยันให้ · เดโมโดย Mikaro Studio",
    },
  },
  "/facilities": {
    title: { en: "Facilities", th: "สิ่งอำนวยความสะดวก" },
    description: {
      en: "Courtyard pool, breakfast on the river pier, garden, lounge, airport transfer, daily housekeeping and luggage storage at The Teak House · a riverside boutique demo by Mikaro Studio.",
      th: "สระว่ายน้ำในคอร์ตยาร์ด อาหารเช้าริมท่าเรือ สวน เลานจ์ รถรับส่งสนามบิน ทำความสะอาดห้องทุกวัน และบริการรับฝากกระเป๋าที่ The Teak House · เดโมโรงแรมบูทีคริมแม่น้ำโดย Mikaro Studio",
    },
  },
  "/experience": {
    title: { en: "Experience", th: "ประสบการณ์" },
    description: {
      en: "River life, courtyard pool, spa mornings and Bangkok walks from The Teak House · a riverside boutique demo by Mikaro Studio.",
      th: "ชีวิตริมแม่น้ำ สระในคอร์ตยาร์ด เช้าวันสบายที่สปา และเส้นทางเดินเที่ยวกรุงเทพจาก The Teak House · เดโมโรงแรมบูทีคริมแม่น้ำโดย Mikaro Studio",
    },
  },
  "/gallery": {
    title: { en: "Gallery", th: "แกลเลอรี" },
    description: {
      en: "Teak interiors, courtyard pool, Chao Phraya views and house dining · browse the Teak House photo gallery.",
      th: "ภายในบ้านไม้สัก สระในคอร์ตยาร์ด วิวแม่น้ำเจ้าพระยา และห้องอาหารของโรงแรม · ชมภาพถ่ายทั้งหมดของ The Teak House",
    },
  },
  "/location": {
    title: { en: "Location", th: "ที่ตั้ง" },
    description: {
      en: "Charoen Krung riverside Bangkok · minutes to the ferries, the old town and the Chao Phraya. Find The Teak House demo hotel.",
      th: "ริมแม่น้ำถนนเจริญกรุง กรุงเทพ · ห่างท่าเรือ เมืองเก่า และแม่น้ำเจ้าพระยาเพียงไม่กี่นาที ดูวิธีเดินทางมาที่ The Teak House",
    },
  },
  "/offers": {
    title: { en: "Offers", th: "ข้อเสนอพิเศษ" },
    description: {
      en: "Direct-only stays: longer nights, breakfast bundles and seasonal river packages. Book at The Teak House demo hotel.",
      th: "ข้อเสนอสำหรับการจองตรงเท่านั้น · พักยาวคุ้มกว่า แพ็กเกจรวมอาหารเช้า และแพ็กเกจริมแม่น้ำตามฤดูกาล จองกับ The Teak House",
    },
  },
  "/contact": {
    title: { en: "Contact", th: "ติดต่อเรา" },
    description: {
      en: "Write the house, call the desk, or message LINE · The Teak House riverside boutique hotel demo in Bangkok.",
      th: "ส่งข้อความถึงเรา โทรหาแผนกต้อนรับ หรือคุยผ่าน LINE · The Teak House โรงแรมบูทีคริมแม่น้ำ กรุงเทพ",
    },
  },
  "/account": {
    title: { en: "Account", th: "บัญชีของฉัน" },
  },
};

/** Room detail pages · the room's own name carries the title. */
export const ROOM_META_FALLBACK: DictEntry = {
  en: "Boutique teak room at The Teak House, Bangkok riverside demo hotel.",
  th: "ห้องพักไม้สักสไตล์บูทีคที่ The Teak House โรงแรมริมแม่น้ำในกรุงเทพ",
};

/**
 * Build a Next Metadata object for a route in the request's language.
 *
 * Reads the locale from the cookie, which middleware also sets from a ?lang=
 * query so a share-preview crawler (which carries no cookies) still gets Thai
 * for a Thai link. `openGraph.locale` is stamped so the preview declares which
 * language it is in.
 */
export function routeMetadata(
  route: keyof typeof ROUTE_META | string,
  overrides: Metadata = {}
): Metadata {
  const locale = getServerLocale();
  return buildMetadata(locale, route, overrides);
}

export function buildMetadata(
  locale: Lang,
  route: string,
  overrides: Metadata = {}
): Metadata {
  const meta = ROUTE_META[route];
  // An override wins · room pages have no ROUTE_META entry and pass the room's
  // own name and description in. The openGraph block below must see the SAME
  // values, or a share card ends up with no title at all.
  const title =
    typeof overrides.title === "string"
      ? overrides.title
      : meta
        ? meta.title[locale]
        : undefined;
  const description =
    typeof overrides.description === "string"
      ? overrides.description
      : meta?.description
        ? meta.description[locale]
        : undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: route },
    openGraph: {
      // type and siteName are repeated from the root layout on purpose · Next
      // REPLACES a parent's openGraph object rather than merging into it, so
      // anything omitted here simply vanishes from the share card.
      type: "website",
      siteName: hotelConfig.name,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      locale: locale === "th" ? "th_TH" : "en_TH",
      url: route,
    },
    ...overrides,
  };
}
