import type { Metadata } from "next";
import { hotelConfig } from "@/config/hotel.config";
import { OG_IMAGE } from "@/lib/images.generated";
import type { DictEntry } from "@/lib/i18n-dict";
import { translateEntry } from "@/lib/i18n-core";
import { LANG_CODES, langMeta, type Lang } from "@/lib/locales/meta";

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
      en: "The Teak House · Five-star Riverside Hotel in Bangkok · Demo by Mikaro Studio",
      th: "The Teak House · โรงแรมห้าดาวริมแม่น้ำ กรุงเทพฯ · เดโมโดย Mikaro Studio",
    },
    description: {
      en: "A five-star hotel on the Chao Phraya in Bangkok's Charoenkrung quarter: river-view rooms and suites, a Thai kitchen on the river terrace, a garden pool. Book direct for the best rate, breakfast included.",
      th: "โรงแรมห้าดาวริมแม่น้ำเจ้าพระยา ย่านเจริญกรุง กรุงเทพฯ ห้องพักและสวีทวิวแม่น้ำ ห้องอาหารไทยบนระเบียงริมน้ำ และสระว่ายน้ำในสวน จองตรงรับราคาดีที่สุด รวมอาหารเช้า",
    },
  },
  "/rooms": {
    title: { en: "Rooms and Suites", th: "ห้องพักและสวีท" },
    description: {
      en: "Six ways to stay on the Chao Phraya, from the 40 m² Deluxe King to the Royal Teak Suite with its own plunge pool. Rates, photographs and what every direct stay includes.",
      th: "หกรูปแบบของห้องพักริมแม่น้ำเจ้าพระยา ตั้งแต่ดีลักซ์ คิง 40 ตร.ม. ถึงรอยัล ทีคสวีทพร้อมสระว่ายน้ำส่วนตัว ดูราคา ภาพถ่าย และสิทธิพิเศษเมื่อจองตรง",
    },
  },
  "/book": {
    title: { en: "Reserve Your Stay", th: "สำรองห้องพัก" },
    description: {
      en: "Choose your dates and room, see the full price with every night itemised, and confirm with a 30% deposit · direct booking at The Teak House, a demo by Mikaro Studio.",
      th: "เลือกวันและห้องพัก ดูราคารวมแยกรายคืน และยืนยันด้วยมัดจำ 30% · ระบบจองตรงของ The Teak House เดโมโดย Mikaro Studio",
    },
  },
  "/dining": {
    title: { en: "Dining at the River Terrace", th: "ห้องอาหารริเวอร์เทอเรซ" },
    description: {
      en: "Breakfast under white parasols, a Thai kitchen that cooks from Bangkok's morning markets, and drinks at the rail at The Teak House.",
      th: "อาหารเช้าใต้ร่มสีขาว ครัวไทยจากวัตถุดิบตลาดเช้าของกรุงเทพฯ และเครื่องดื่มริมราวระเบียงที่ The Teak House",
    },
  },
  "/dining/reserve": {
    title: { en: "Reserve a Table", th: "จองโต๊ะอาหาร" },
    description: {
      en: "Reserve a table at the River Terrace: pick a date, a time and a party size, no deposit required. A demo by Mikaro Studio.",
      th: "จองโต๊ะที่ริเวอร์เทอเรซ เลือกวัน เวลา และจำนวนท่าน ไม่ต้องวางมัดจำ · เดโมโดย Mikaro Studio",
    },
  },
  "/events": {
    title: { en: "Weddings and Events", th: "งานแต่งงานและงานเลี้ยง" },
    description: {
      en: "Garden ceremonies for up to 180 guests, long-table dinners and private celebrations on the Chao Phraya, plus the hotel's calendar of special evenings.",
      th: "พิธีในสวนสำหรับแขกสูงสุด 180 ท่าน ดินเนอร์โต๊ะยาว และงานเฉลิมฉลองส่วนตัวริมแม่น้ำเจ้าพระยา พร้อมปฏิทินค่ำคืนพิเศษของโรงแรม",
    },
  },
  "/events/reserve": {
    title: { en: "Reserve Seats", th: "สำรองที่นั่ง" },
    description: {
      en: "Request seats at a special evening at The Teak House · no payment, the hotel confirms. A demo by Mikaro Studio.",
      th: "ขอสำรองที่นั่งในค่ำคืนพิเศษที่ The Teak House · ไม่ต้องชำระเงิน โรงแรมจะยืนยันให้ · เดโมโดย Mikaro Studio",
    },
  },
  "/facilities": {
    title: { en: "Facilities", th: "สิ่งอำนวยความสะดวก" },
    description: {
      en: "A garden pool, a private river pier, the lobby lounge, airport transfers and twice-daily housekeeping at The Teak House, Bangkok.",
      th: "สระว่ายน้ำในสวน ท่าเรือส่วนตัวริมแม่น้ำ เลานจ์ล็อบบี้ บริการรับส่งสนามบิน และแม่บ้านดูแลวันละสองครั้งที่ The Teak House กรุงเทพฯ",
    },
  },
  "/experience": {
    title: { en: "Experience", th: "ประสบการณ์" },
    description: {
      en: "Breakfast at the river terrace, the garden pool, a spa in the Wat Pho tradition and evenings on the river, at a five-star hotel in old Bangkok.",
      th: "อาหารเช้าที่ระเบียงริมแม่น้ำ สระว่ายน้ำในสวน สปาตามแบบแผนวัดโพธิ์ และค่ำคืนบนสายน้ำ ที่โรงแรมห้าดาวในย่านกรุงเทพฯ เก่า",
    },
  },
  "/gallery": {
    title: { en: "Gallery", th: "แกลเลอรี" },
    description: {
      en: "Light, teak and water: the spaces, the pool and spa, and the table at The Teak House.",
      th: "แสง ไม้สัก และสายน้ำ ภาพพื้นที่ต่าง ๆ สระว่ายน้ำและสปา และโต๊ะอาหารของ The Teak House",
    },
  },
  "/location": {
    title: { en: "Location", th: "ที่ตั้งและการเดินทาง" },
    description: {
      en: "Charoenkrung 44, Bang Rak: on the river in old Bangkok, eight minutes on foot from BTS Saphan Taksin. Directions by skytrain, river and car.",
      th: "เจริญกรุง 44 บางรัก ริมแม่น้ำในกรุงเทพฯ เก่า เดินแปดนาทีจากบีทีเอสสะพานตากสิน เส้นทางโดยรถไฟฟ้า ทางเรือ และรถยนต์",
    },
  },
  "/offers": {
    title: { en: "Offers", th: "ข้อเสนอพิเศษ" },
    description: {
      en: "Direct-only offers at The Teak House: early booking, longer stays and a private airport arrival.",
      th: "ข้อเสนอสำหรับการจองตรงที่ The Teak House จองล่วงหน้า พักนานขึ้น และบริการรับจากสนามบิน",
    },
  },
  "/contact": {
    title: { en: "Contact", th: "ติดต่อเรา" },
    description: {
      en: "Write to the hotel, call the concierge or message us on LINE · The Teak House, a five-star riverside hotel in Bangkok.",
      th: "ส่งข้อความถึงโรงแรม โทรหาคอนเซียร์จ หรือคุยกับเราทาง LINE · The Teak House โรงแรมห้าดาวริมแม่น้ำ กรุงเทพฯ",
    },
  },
  "/account": {
    title: { en: "Account", th: "บัญชีของฉัน" },
  },
};

/** Room detail pages · the room's own name carries the title. */
export const ROOM_META_FALLBACK: DictEntry = {
  en: "A room at The Teak House, a five-star riverside hotel in Bangkok.",
  th: "ห้องพักที่ The Teak House โรงแรมห้าดาวริมแม่น้ำ กรุงเทพฯ",
};

/**
 * Build a Next Metadata object for a route in the page's language.
 *
 * The language comes from the route (app/[lang]), never the request, so every
 * page stays static. One URL serves every language (the middleware picks it),
 * so the alternates are that URL with ?lang=xx for each of the sixteen, which
 * the middleware promotes into the cookie · a crawler or a share preview
 * following a Thai alternate gets Thai. `openGraph.locale` is stamped so the
 * preview declares which language it is in.
 */
export function routeMetadata(
  locale: Lang,
  route: keyof typeof ROUTE_META | string,
  overrides: Metadata = {}
): Metadata {
  return buildMetadata(locale, route, overrides);
}

/** hreflang alternates for a public route · one URL, ?lang= per language. */
export function languageAlternates(route: string): Record<string, string> {
  const out: Record<string, string> = { "x-default": route };
  for (const code of LANG_CODES) out[langMeta(code).tag] = `${route}?lang=${code}`;
  return out;
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
        ? translateEntry(locale, meta.title)
        : undefined;
  const description =
    typeof overrides.description === "string"
      ? overrides.description
      : meta?.description
        ? translateEntry(locale, meta.description)
        : undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: route, languages: languageAlternates(route) },
    openGraph: {
      // type and siteName are repeated from the root layout on purpose · Next
      // REPLACES a parent's openGraph object rather than merging into it, so
      // anything omitted here simply vanishes from the share card.
      type: "website",
      siteName: hotelConfig.name,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      locale: langMeta(locale).og,
      url: route,
      images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: hotelConfig.name }],
    },
    ...overrides,
  };
}
