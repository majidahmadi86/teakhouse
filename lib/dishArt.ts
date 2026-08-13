import type { DictEntry } from "@/lib/i18n-dict";
/**
 * v14 · Seeded thumbnail art for the menu.
 *
 * Keyed by the seeded dish id, so the map only ever applies to the demo's own
 * dishes · a dish the owner creates has no entry and simply shows no
 * thumbnail, which is the intended behaviour (the menu must stay elegant, and
 * a missing thumbnail is better than a wrong one).
 *
 * An uploaded `dish.image` always wins over this map. Files are square crops
 * encoded locally at 128 and 256 by scripts/build-facility-images.js.
 */
export const DISH_ART: Record<string, { base: string; alt: DictEntry }> = {
  // Breakfast on the pier
  "dc-pier-breakfast-i1": {
    base: "/images/dishes/rice-soup",
    alt: { en: "Rice soup with river prawns in a claypot", th: "ข้าวต้มกุ้งแม่น้ำหม้อดิน" },
  },
  "dc-pier-breakfast-i2": {
    base: "/images/dishes/crab-omelette",
    alt: { en: "Thai omelette served over rice", th: "ไข่เจียวราดข้าว" },
  },
  "dc-pier-breakfast-i3": {
    base: "/images/dishes/fruit-tray",
    alt: { en: "Sliced tropical fruit on a plate", th: "ผลไม้เขตร้อนหั่นจัดจาน" },
  },
  "dc-pier-breakfast-i4": {
    base: "/images/dishes/coconut-pancakes",
    alt: { en: "Small coconut pancakes", th: "ขนมครกมะพร้าว" },
  },
  "dc-pier-breakfast-i5": {
    base: "/images/dishes/eggs",
    alt: { en: "Eggs and toast on a breakfast plate", th: "ไข่และขนมปังปิ้งในจานอาหารเช้า" },
  },
  "dc-pier-breakfast-i6": {
    base: "/images/dishes/coffee",
    alt: { en: "A cup of filter coffee", th: "กาแฟดริปหนึ่งแก้ว" },
  },

  // Thai kitchen
  "dc-thai-kitchen-i1": {
    base: "/images/dishes/pad-thai",
    alt: { en: "Pad thai noodles with prawns", th: "ผัดไทยกุ้ง" },
  },
  "dc-thai-kitchen-i2": {
    base: "/images/dishes/massaman",
    alt: { en: "Massaman curry with beef", th: "แกงมัสมั่นเนื้อ" },
  },
  "dc-thai-kitchen-i3": {
    base: "/images/dishes/grilled-fish",
    alt: { en: "Whole grilled fish", th: "ปลาเผาทั้งตัว" },
  },
  "dc-thai-kitchen-i4": {
    base: "/images/dishes/green-curry",
    alt: { en: "Green curry with chicken", th: "แกงเขียวหวานไก่" },
  },
  "dc-thai-kitchen-i5": {
    base: "/images/dishes/pomelo-salad",
    alt: { en: "Pomelo salad on a plate", th: "ยำส้มโอจัดจาน" },
  },
  "dc-thai-kitchen-i6": {
    base: "/images/dishes/morning-glory",
    alt: { en: "Stir-fried morning glory", th: "ผัดผักบุ้งไฟแดง" },
  },
  "dc-thai-kitchen-i7": {
    base: "/images/dishes/tom-yum",
    alt: { en: "Tom yum soup with river prawns", th: "ต้มยำกุ้งแม่น้ำ" },
  },
  "dc-thai-kitchen-i8": {
    base: "/images/dishes/mango-sticky-rice",
    alt: { en: "Mango with coconut sticky rice", th: "ข้าวเหนียวมะม่วง" },
  },

  // Drinks & cocktails
  "dc-drinks-i1": {
    base: "/images/dishes/sundowner",
    alt: { en: "A cocktail in a coupe glass", th: "ค็อกเทลในแก้วก้านสั้น" },
  },
  "dc-drinks-i2": {
    base: "/images/dishes/lemongrass-cooler",
    alt: { en: "An iced herbal cooler", th: "เครื่องดื่มสมุนไพรเย็น" },
  },
  "dc-drinks-i3": {
    base: "/images/dishes/iced-tea",
    alt: { en: "A glass of iced tea", th: "ชาเย็นหนึ่งแก้ว" },
  },
  "dc-drinks-i4": {
    base: "/images/dishes/beer",
    alt: { en: "A cold beer", th: "เบียร์เย็น" },
  },
};

export function dishArt(id: string) {
  return DISH_ART[id];
}
