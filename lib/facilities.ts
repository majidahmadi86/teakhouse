/**
 * What the hotel keeps for its guests · one list, used by /facilities and the
 * home page so the two can never drift apart.
 *
 * `key` is the dictionary prefix: `${key}.h` is the name, `${key}.p` the first
 * line, `${key}.p2` the second. `image` is a registry id (lib/images.ts) when
 * a photograph of exactly this facility passed the art direction; the others
 * are listed as services in words, never with a stand-in photograph.
 */
import type { DictEntry } from "@/lib/i18n-dict";

export type Facility = {
  key: string;
  image?: string;
  /** Bilingual · screen readers and search engines read this too. */
  alt?: DictEntry;
};

export const FACILITIES: Facility[] = [
  {
    key: "fac.pool",
    image: "fac-pool",
    alt: { en: "Cushioned loungers and parasols on a stone deck beside the green-tiled pool", th: "เก้าอี้อาบแดดและร่มบนลานหินข้างสระว่ายน้ำปูกระเบื้องสีเขียว" },
  },
  {
    key: "fac.garden",
    image: "fac-garden",
    alt: { en: "Pale stone stepping slabs crossing the lawn toward the sunken garden lounge", th: "แผ่นหินทางเดินสีอ่อนพาดผ่านสนามหญ้าสู่เลานจ์สวนแบบลดระดับ" },
  },
  {
    key: "fac.lounge",
    image: "fac-lounge",
    alt: { en: "A bright lounge corner with woven armchairs among potted palms", th: "มุมเลานจ์สว่างพร้อมอาร์มแชร์สานท่ามกลางต้นปาล์มในกระถาง" },
  },
  {
    key: "fac.transfer",
    image: "fac-transfer",
    alt: { en: "White leather rear seats of the hotel car, the door held open", th: "เบาะหลังหนังสีขาวของรถโรงแรม ประตูเปิดรอ" },
  },
  {
    key: "fac.housekeeping",
    image: "fac-housekeeping",
    alt: { en: "Two stacks of crisply folded white linen", th: "ผ้าปูสีขาวพับเรียบสองกอง" },
  },
  { key: "fac.pier" },
  { key: "fac.luggage" },
];
