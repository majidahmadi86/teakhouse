import { hotelConfig } from "@/config/hotel.config";

export type ConciergeReply = {
  en: string;
  th: string;
};

export const CONCIERGE_CHIPS = {
  en: ["Tonight's rates", "Airport pickup", "Late check-in", "Book a room"],
  th: ["ราคาคืนนี้", "รถรับสนามบิน", "เช็คอินดึก", "จองห้องพัก"],
};

export const CONCIERGE_HELLO: ConciergeReply = hotelConfig.concierge.hello;

export const CONCIERGE_FALLBACK: ConciergeReply = hotelConfig.concierge.fallback;

/**
 * The offline answer to anything about price or availability.
 *
 * This matcher only runs when /api/concierge is unreachable, so it has no live
 * calendar and no live rates behind it. Nightly prices now move by date, which
 * means any number quoted here would be a guess · it quotes none and hands off
 * to the booking page, which does know. Thai reused verbatim from the existing
 * booking reply below.
 */
const LIVE_CHECK: ConciergeReply = {
  en: 'Rates and availability move by date, so let me check yours rather than guess. The booking page shows live availability and the exact price for every night. <a href="/book" class="font-extrabold text-blue">Book direct here</a>',
  th: 'ยินดีค่ะ หน้าจองแสดงห้องว่างแบบเรียลไทม์ มัดจำผ่านบัตรหรือพร้อมเพย์ แล้วยืนยันห้องทันทีค่ะ <a href="/book" class="font-extrabold text-blue">จองตรงที่นี่</a>',
};

const INTENTS: { k: RegExp; r: ConciergeReply }[] = [
  {
    k: /rate|price|cost|how much|tonight|available|vacan|ราคา|เท่าไหร่|เท่าไร|กี่บาท|คืนนี้|ห้องว่าง|ว่างไหม/i,
    r: LIVE_CHECK,
  },
  {
    k: /airport|pickup|transfer|taxi|suvarnabhumi|don ?m|สนามบิน|รถรับ|แท็กซี่|สุวรรณภูมิ|ดอนเมือง/i,
    r: {
      en: "We arrange a private sedan from Suvarnabhumi (฿1,200) or Don Mueang (฿1,000), any hour. The driver waits at gate 3 with your name on a teak sign. Just send your flight number after booking.",
      th: "ทางเราจัดรถส่วนตัวรับจากสุวรรณภูมิ (1,200.-) หรือดอนเมือง (1,000.-) ได้ทุกเวลาค่ะ คนขับรอที่ประตู 3 พร้อมป้ายชื่อของคุณ เพียงส่งเลขเที่ยวบินหลังจองห้องค่ะ",
    },
  },
  {
    k: /check[- ]?in|check[- ]?out|late|arriv|midnight|เช็คอิน|เช็คเอาท์|ดึก|เที่ยงคืน|กี่โมง/i,
    r: {
      en: `Check-in from ${hotelConfig.policies.checkIn}, check-out by ${hotelConfig.policies.checkOut}. Arriving late is never a problem: the house desk is staffed 24 hours, and I hold your room until you knock. Tell me your arrival time and it will be noted.`,
      th: `เช็คอินตั้งแต่ ${hotelConfig.policies.checkIn} น. เช็คเอาท์ก่อน ${hotelConfig.policies.checkOut} น. ค่ะ มาดึกแค่ไหนก็ไม่มีปัญหา ฟรอนต์มีคนดูแลตลอด 24 ชั่วโมง และน้ำจะเก็บห้องไว้ให้จนกว่าคุณจะมาถึงค่ะ บอกเวลาถึงได้เลยนะคะ`,
    },
  },
  {
    // v13 · reserve a table · MUST stay ahead of the room-booking intent below,
    // which also matches "book". "Can I book a table?" pointed at the room
    // booking page until this went first. Hours here are the seeded service
    // window; the live /api/concierge path quotes the owner's current hours.
    k: /table|โต๊ะ/i,
    r: {
      en: 'With pleasure. Tell me a date, a time and how many, and the kitchen will hold a table · no deposit. Service runs 11:30 to 22:00. <a href="/dining/reserve" class="font-extrabold text-blue">Reserve a table here</a>',
      th: 'With pleasure. Tell me a date, a time and how many, and the kitchen will hold a table · no deposit. Service runs 11:30 to 22:00. <a href="/dining/reserve" class="font-extrabold text-blue">Reserve a table here</a>',
    },
  },
  {
    k: /book|reserve|จอง/i,
    r: {
      en: 'With pleasure. The booking page shows live availability and takes a small deposit by card or PromptPay, and your room is confirmed instantly. <a href="/book" class="font-extrabold text-blue">Book direct here</a>',
      th: 'ยินดีค่ะ หน้าจองแสดงห้องว่างแบบเรียลไทม์ มัดจำผ่านบัตรหรือพร้อมเพย์ แล้วยืนยันห้องทันทีค่ะ <a href="/book" class="font-extrabold text-blue">จองตรงที่นี่</a>',
    },
  },
  {
    // v12 · events & spaces · before the food intent so "private dinner",
    // "wedding dinner" land here. EN keywords only · Thai questions reach the
    // live /api/concierge path, which answers from the events table.
    k: /wedding|event|party|parties|celebrat|function|pavilion|private dinner|jazz|brunch|loy krathong|songkran/i,
    r: {
      en: 'The riverside pavilion hosts weddings, private dinners and parties: 60 seated, 90 standing, arrivals by boat welcome. Our special evenings are on the events page. <a href="/events" class="font-extrabold text-blue">Events &amp; Spaces</a>',
      th: 'The riverside pavilion hosts weddings, private dinners and parties: 60 seated, 90 standing, arrivals by boat welcome. Our special evenings are on the events page. <a href="/events" class="font-extrabold text-blue">Events &amp; Spaces</a>',
    },
  },
  {
    // v12 · widened with menu/dining hour keywords · reply now hands off to
    // the dining page, whose menu is the same database the owner edits.
    k: /breakfast|food|dinner|restaurant|eat|menu|lunch|dining|cocktail|อาหาร|ข้าวเช้า|อาหารเช้า|ร้านอาหาร|กิน|เมนู/i,
    r: {
      en: 'Breakfast is served on the pier from 07:00 to 11:00: Thai rice soup, fresh fruit, eggs any way, and coffee roasted in Chiang Rai. The kitchen cooks until 22:00. <a href="/dining" class="font-extrabold text-blue">See the full menu</a>',
      th: 'อาหารเช้าเสิร์ฟริมท่าเรือ 07:00 ถึง 11:00 น. มีข้าวต้ม ผลไม้สด ไข่ตามสั่ง และกาแฟคั่วจากเชียงรายค่ะ <a href="/dining" class="font-extrabold text-blue">See the full menu</a>',
    },
  },
  {
    k: /pool|swim|สระ|ว่ายน้ำ/i,
    r: {
      en: "The courtyard pool is open 07:00 to 21:00, saltwater, shaded by the old mango tree. Towels at the pool house, no reservation needed.",
      th: "สระน้ำเกลือกลางคอร์ทยาร์ดเปิด 07:00 ถึง 21:00 น. ใต้ร่มต้นมะม่วงเก่าแก่ค่ะ มีผ้าเช็ดตัวที่ศาลาริมสระ ไม่ต้องจองล่วงหน้าค่ะ",
    },
  },
  {
    k: /where|address|bts|train|boat|get there|map|location|ที่ไหน|เดินทาง|รถไฟฟ้า|เรือ|แผนที่/i,
    r: {
      en: `${hotelConfig.contact.addressShort.en}. <a href="/location" class="font-extrabold text-blue">Directions</a>`,
      th: `${hotelConfig.contact.addressShort.th} ค่ะ <a href="/location" class="font-extrabold text-blue">ดูการเดินทาง</a>`,
    },
  },
  {
    k: /pet|dog|cat|สัตว์เลี้ยง|หมา|สุนัข|แมว/i,
    r: hotelConfig.policies.pets,
  },
  {
    k: /cancel|refund|policy|ยกเลิก|คืนเงิน|เงื่อนไข/i,
    r: hotelConfig.policies.cancel,
  },
  {
    k: /hello|hi|hey|สวัสดี|หวัดดี|ดีค|ดีครับ/i,
    r: {
      en: `Welcome to ${hotelConfig.name}. What may I help you with: rates, rooms, or getting here?`,
      th: hotelConfig.concierge.hello.th,
    },
  },
];

export function matchConciergeIntent(message: string): ConciergeReply | null {
  for (const intent of INTENTS) {
    if (intent.k.test(message)) return intent.r;
  }
  return null;
}

/** Facts for AI system prompt · config + never invent prices. */
export function conciergeConfigFacts(): string {
  return hotelConfig.concierge.facts.map((f) => f.en).join(" ");
}
