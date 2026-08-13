/**
 * The seven things the house keeps · one list, used by the /facilities page and
 * the home strip so the two can never drift apart.
 *
 * `key` is the dictionary prefix: `${key}.h` is the name, `${key}.p` the first
 * line, `${key}.p2` the second. `base` is the local image path without the
 * width/extension suffix (see components/LocalPicture).
 */
import type { DictEntry } from "@/lib/i18n-dict";

export type Facility = {
  base: string;
  key: string;
  /** Bilingual · screen readers and search engines read this too. */
  alt: DictEntry;
};

export const FACILITIES: Facility[] = [
  {
    base: "/images/facilities/pool",
    key: "fac.pool",
    alt: { en: "Saltwater pool in the courtyard", th: "สระน้ำเกลือในคอร์ตยาร์ด" },
  },
  {
    base: "/images/facilities/pier-breakfast",
    key: "fac.pier",
    alt: { en: "Breakfast tables on the river pier", th: "โต๊ะอาหารเช้าริมท่าเรือ" },
  },
  {
    base: "/images/facilities/courtyard-garden",
    key: "fac.garden",
    alt: { en: "Flowering courtyard garden", th: "สวนดอกไม้กลางคอร์ตยาร์ด" },
  },
  {
    base: "/images/facilities/lobby-lounge",
    key: "fac.lounge",
    alt: { en: "Teak lobby lounge with armchairs", th: "เลานจ์ไม้สักพร้อมเก้าอี้นวม" },
  },
  {
    base: "/images/facilities/airport-transfer",
    key: "fac.transfer",
    alt: { en: "Private car for airport transfer", th: "รถส่วนตัวรับส่งสนามบิน" },
  },
  {
    base: "/images/facilities/housekeeping",
    key: "fac.housekeeping",
    alt: { en: "Folded linen for daily housekeeping", th: "ผ้าปูที่พับเรียบร้อยสำหรับทำความสะอาดห้องทุกวัน" },
  },
  {
    base: "/images/facilities/luggage-storage",
    key: "fac.luggage",
    alt: { en: "Guest luggage stored behind the desk", th: "กระเป๋าของแขกที่ฝากไว้หลังเคาน์เตอร์" },
  },
];
