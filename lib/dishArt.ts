import type { DictEntry } from "@/lib/i18n-dict";

/**
 * Seeded thumbnail art for the menu · registry ids (lib/images.ts), square
 * crops at 128 to 768 px.
 *
 * Keyed by the seeded dish id, so the map only ever applies to the demo's own
 * dishes · a dish the owner creates has no entry and simply shows no
 * thumbnail (a missing thumbnail is better than a wrong one). An uploaded
 * `dish.image` always wins over this map. "dc-pier-breakfast-i4" (coconut
 * pancakes) was retired in v17: no photograph of it passed, so it has none.
 */
export const DISH_ART: Record<string, { id: string; alt: DictEntry }> = {
  "dc-pier-breakfast-i1": { id: "dish-rice-soup", alt: { en: "Rice soup with river prawns in a clay pot", th: "ข้าวต้มกุ้งแม่น้ำในหม้อดิน" } },
  "dc-pier-breakfast-i2": { id: "dish-crab-omelette", alt: { en: "A golden Thai omelette with cucumber and coriander", th: "ไข่เจียวสีทองกับแตงกวาและผักชี" } },
  "dc-pier-breakfast-i3": { id: "dish-fruit-tray", alt: { en: "A plate of cut mango, orange and banana", th: "จานผลไม้มะม่วง ส้ม และกล้วยหั่น" } },
  "dc-pier-breakfast-i5": { id: "dish-eggs", alt: { en: "Two fried eggs over toast on a white plate", th: "ไข่ดาวสองฟองบนขนมปังปิ้งในจานขาว" } },
  "dc-pier-breakfast-i6": { id: "dish-coffee", alt: { en: "Hot water poured over a pour-over coffee", th: "รินน้ำร้อนลงกาแฟดริป" } },
  "dc-thai-kitchen-i1": { id: "dish-pad-thai", alt: { en: "Pad thai with prawns and bean sprouts", th: "ผัดไทยกุ้งกับถั่วงอก" } },
  "dc-thai-kitchen-i2": { id: "dish-massaman", alt: { en: "A curry with a dome of jasmine rice", th: "แกงกับข้าวหอมมะลิ" } },
  "dc-thai-kitchen-i3": { id: "dish-grilled-fish", alt: { en: "A whole grilled fish on a banana leaf", th: "ปลาย่างทั้งตัวบนใบตอง" } },
  "dc-thai-kitchen-i4": { id: "dish-green-curry", alt: { en: "Green curry with chillies and herbs", th: "แกงเขียวหวานกับพริกและสมุนไพร" } },
  "dc-thai-kitchen-i5": { id: "dish-pomelo-salad", alt: { en: "A salad with pink pomelo segments", th: "ยำส้มโอ" } },
  "dc-thai-kitchen-i6": { id: "dish-morning-glory", alt: { en: "Stir-fried morning glory with chilli and garlic", th: "ผัดผักบุ้งกับพริกและกระเทียม" } },
  "dc-thai-kitchen-i7": { id: "dish-tom-yum", alt: { en: "Tom yum with prawns and mushrooms", th: "ต้มยำกุ้งกับเห็ด" } },
  "dc-thai-kitchen-i8": { id: "dish-mango-sticky-rice", alt: { en: "Mango with sticky rice and coconut cream", th: "ข้าวเหนียวมะม่วงกับกะทิ" } },
  "dc-drinks-i1": { id: "dish-sundowner", alt: { en: "An amber cocktail with an orange twist", th: "ค็อกเทลสีอำพันกับผิวส้ม" } },
  "dc-drinks-i2": { id: "dish-lemongrass-cooler", alt: { en: "A tall iced cooler with lime", th: "เครื่องดื่มเย็นแก้วสูงกับมะนาว" } },
  "dc-drinks-i3": { id: "dish-iced-tea", alt: { en: "A tall glass of iced tea", th: "ชาเย็นแก้วสูง" } },
  "dc-drinks-i4": { id: "dish-beer", alt: { en: "A glass of cold beer on the deck", th: "เบียร์เย็นหนึ่งแก้วบนดาดฟ้าไม้" } },
};

export function dishArt(id: string) {
  return DISH_ART[id];
}
