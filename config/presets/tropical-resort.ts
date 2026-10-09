import type { HotelConfig } from "../types";
import { TEAK_PALETTE } from "../types";

const u = (id: string) => `https://images.unsplash.com/${id}`;

/** Current Teak House · blessed v7 guest visual language. */
export const config: HotelConfig = {
  id: "tropical-resort",
  name: "The Teak House",
  nameDisplay: "THE TEAK HOUSE",
  tagline: {
    en: "Riverside Hotel · Bangkok",
    th: "โรงแรมริมแม่น้ำ · กรุงเทพฯ",
  },
  logoPath: "/favicon.svg",
  siteUrl: "https://teakhouse.mikaro.studio",
  palette: TEAK_PALETTE,
  fonts: {
    display: "Marcellus",
    sans: "Plus Jakarta Sans",
    thDisplay: "Kanit",
    thBody: "Sarabun",
  },
  photos: {
    hero: [
      u("photo-1566073771259-6a8506099945"),
      u("photo-1582719478250-c89cae4dc85b"),
      u("photo-1571008887538-b36bb74556e6"),
    ],
    gallery: [
      u("photo-1631049307264-da0ec9d70304"),
      u("photo-1618773928121-c32242e63f39"),
      u("photo-1578683010236-d716f9a3f461"),
    ],
    about: u("photo-1582719478250-c89cae4dc85b"),
  },
  currencies: ["THB", "USD", "EUR", "GBP", "JPY", "CNY", "SGD", "AUD", "HKD", "KRW", "CHF", "AED", "INR"],
  languages: ["en", "th", "zh", "ja", "ko", "ru", "de", "fr", "es", "it", "pt", "ar", "hi", "id", "vi", "ms"],
  contact: {
    email: "stay@teakhouse.demo",
    phone: "+66 2 000 0000",
    line: "@teakhouse",
    address: {
      en: "Charoenkrung 44, Bang Rak, Bangkok 10500",
      th: "เจริญกรุง 44 บางรัก กรุงเทพฯ 10500",
    },
    addressShort: {
      en: "Charoenkrung 44, Bang Rak, Bangkok",
      th: "เจริญกรุง 44 บางรัก กรุงเทพฯ",
    },
  },
  map: { lat: 13.7234, lng: 100.5142, zoom: 15 },
  policies: {
    checkIn: "14:00",
    checkOut: "12:00",
    cancel: {
      en: "Free cancellation up to 3 days before arrival.",
      th: "ยกเลิกฟรีก่อนเข้าพัก 3 วัน",
    },
    pets: {
      en: "We regret that pets cannot stay, with the exception of assistance animals.",
      th: "ขออภัย โรงแรมไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพัก ยกเว้นสัตว์ช่วยเหลือผู้พิการ",
    },
    depositPct: 30,
  },
  concierge: {
    name: { en: "Nam · The Teak House", th: "น้ำ · The Teak House" },
    hello: {
      en: "Sawasdee kha, welcome to The Teak House. I answer every hour of the night, in English and Thai. How can I help?",
      th: "สวัสดีค่ะ ยินดีต้อนรับสู่ The Teak House ค่ะ น้ำตอบทุกคำถามตลอด 24 ชั่วโมง ทั้งภาษาไทยและอังกฤษ ให้ช่วยอะไรดีคะ",
    },
    fallback: {
      en: "I want to get that exactly right for you, so I have passed it to the front office. They reply within the hour on LINE (@teakhouse). Meanwhile, may I help with rates, rooms or getting here?",
      th: "เรื่องนี้น้ำขอส่งต่อให้ทีมต้อนรับตอบให้ถูกต้องที่สุดนะคะ ทีมจะตอบกลับภายใน 1 ชั่วโมงทาง LINE (@teakhouse) ค่ะ ระหว่างนี้ให้น้ำช่วยเรื่องราคา ห้องพัก หรือการเดินทางไหมคะ",
    },
    facts: [
      {
        en: "A five-star riverside hotel on the Chao Phraya in Charoenkrung, Bang Rak: 151 rooms and suites in six types, from the Deluxe King (40 m², from 6,900 THB) to the Royal Teak Suite (210 m², private plunge pool).",
        th: "โรงแรมห้าดาวริมแม่น้ำเจ้าพระยา เจริญกรุง บางรัก ห้องพักและสวีท 151 ห้องใน 6 ประเภท ตั้งแต่ดีลักซ์ คิง (40 ตร.ม. เริ่ม 6,900 บาท) ถึงรอยัล ทีคสวีท (210 ตร.ม. พร้อมสระว่ายน้ำส่วนตัว)",
      },
      {
        en: "Check-in from 14:00, check-out by 12:00. Desk staffed 24 hours.",
        th: "เช็คอิน 14:00 เช็คเอาท์ 12:00 ฟรอนต์ 24 ชั่วโมง",
      },
      {
        en: "Free cancellation up to 3 days before arrival.",
        th: "ยกเลิกฟรีก่อนเข้าพัก 3 วัน",
      },
    ],
  },
  metadata: {
    title:
      "The Teak House · Five-star Riverside Hotel in Bangkok · Demo by Mikaro Studio",
    description:
      "A five-star hotel on the Chao Phraya in Bangkok: river-view rooms and suites, a Thai kitchen on the river terrace and a garden pool. Book direct for the best rate. Demo by Mikaro Studio.",
  },
};
