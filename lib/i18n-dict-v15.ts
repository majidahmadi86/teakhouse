import type { DictEntry } from "./i18n-dict";

/**
 * v15 · Eight-Star copy · booking flow, payment rails, concierge in-stay mode,
 * currency notes, and the dual-role owner portal. Merged into DICT by
 * lib/i18n-dict.ts, so every key here is reachable through t() everywhere and
 * audited by scripts/th-missing.js like the rest.
 */
export const DICT_V15: Record<string, DictEntry> = {
  /* ── Booking · steps and sections ─────────────────────────────────────── */
  "bk.step1": { en: "Your stay", th: "การเข้าพักของคุณ" },
  "bk.step2": { en: "Confirm & pay", th: "ยืนยันและชำระ" },
  "bk.step3": { en: "Confirmed", th: "ยืนยันแล้ว" },
  "bk.continue": { en: "Continue to confirm", th: "ไปหน้ายืนยัน" },
  "bk.where": { en: "Where you'll sleep", th: "ห้องที่คุณจะพัก" },
  "bk.where.p": {
    en: "Touch a room on the plan or choose from the list. The plan tints what is free for your dates.",
    th: "แตะห้องบนแผนผังหรือเลือกจากรายการ แผนผังจะแสดงห้องที่ว่างสำหรับวันที่ของคุณ",
  },
  "bk.minStay": { en: "Minimum {n} nights on these dates", th: "พักขั้นต่ำ {n} คืนสำหรับวันที่นี้" },
  "bk.unitsLeft": { en: "Only {n} left for these dates", th: "เหลือเพียง {n} ห้องสำหรับวันที่นี้" },
  "bk.arrival": { en: "Arrival time (optional)", th: "เวลาถึง (ไม่บังคับ)" },
  "bk.requests": { en: "Anything we should know?", th: "มีอะไรอยากให้เราทราบไหมคะ" },
  "bk.requestsph": {
    en: "Allergies, an occasion, a pillow you cannot sleep without…",
    th: "อาการแพ้ โอกาสพิเศษ หมอนที่ขาดไม่ได้…",
  },
  "bk.confirming": { en: "Confirming…", th: "กำลังยืนยัน…" },

  /* ── Booking · the plan ───────────────────────────────────────────────── */
  "bk.map.title": { en: "Plan of The Teak House · choose a room", th: "แผนผัง The Teak House · เลือกห้อง" },
  "bk.map.river": { en: "Chao Phraya", th: "แม่น้ำเจ้าพระยา" },
  "bk.map.pier": { en: "Pier", th: "ท่าเรือ" },
  "bk.map.courtyard": { en: "Courtyard & mango tree", th: "คอร์ทยาร์ดและต้นมะม่วง" },
  "bk.map.pool": { en: "Pool", th: "สระว่ายน้ำ" },
  "bk.map.house": { en: "The house", th: "ตัวบ้าน" },
  "bk.map.upper": { en: "Upper floor", th: "ชั้นบน" },
  "bk.map.full": { en: "Not available", th: "ไม่ว่าง" },
  "bk.map.free": { en: "Available", th: "ว่าง" },
  "bk.map.hint": { en: "Hover or tap a room to preview it.", th: "ชี้หรือแตะห้องเพื่อดูตัวอย่าง" },

  /* ── Booking · packages ───────────────────────────────────────────────── */
  "bk.pkg.h2": { en: "Make it yours", th: "เติมความพิเศษให้เป็นของคุณ" },
  "bk.pkg.p": {
    en: "Helicopter from the airport, a private chef on the balcony, a spa itinerary written around you. Add what you like; the price updates as you go.",
    th: "เฮลิคอปเตอร์จากสนามบิน เชฟส่วนตัวที่ระเบียง โปรแกรมสปาที่ออกแบบเพื่อคุณ เพิ่มได้ตามใจ ราคาปรับให้ทันที",
  },
  "bk.pkg.loading": { en: "Packages are loading…", th: "กำลังโหลดแพ็กเกจ…" },
  "bk.pkg.unit.stay": { en: "per stay", th: "ต่อการเข้าพัก" },
  "bk.pkg.unit.night": { en: "per night", th: "ต่อคืน" },
  "bk.pkg.unit.person": { en: "per person", th: "ต่อท่าน" },
  "bk.pkg.less": { en: "One fewer", th: "ลดลงหนึ่ง" },
  "bk.pkg.more": { en: "One more", th: "เพิ่มอีกหนึ่ง" },

  /* ── Booking · payment ────────────────────────────────────────────────── */
  "bk.pay.how": { en: "How would you like to pay the deposit?", th: "ต้องการชำระมัดจำด้วยวิธีใดคะ" },
  "bk.pay.pci": {
    en: "Card details are entered on our payment partner's page, never here.",
    th: "ข้อมูลบัตรจะกรอกบนหน้าของพันธมิตรชำระเงินเท่านั้น ไม่ใช่ที่นี่",
  },
  "bk.rail.promptpay": { en: "PromptPay", th: "พร้อมเพย์" },
  "bk.rail.promptpay.sub": { en: "Scan with any Thai bank app", th: "สแกนด้วยแอปธนาคารไทย" },
  "bk.rail.promptpay.note": {
    en: "A QR appears after you confirm. The house confirms your deposit as soon as the transfer lands.",
    th: "จะมี QR แสดงหลังยืนยัน ทางบ้านจะยืนยันมัดจำทันทีที่เงินเข้า",
  },
  "bk.rail.card": { en: "Card & wallets", th: "บัตรและวอลเล็ต" },
  "bk.rail.card.sub": { en: "Visa, Mastercard, Apple Pay, Google Pay", th: "บัตร Visa, Mastercard และวอลเล็ต Apple Pay, Google Pay" },
  "bk.rail.card.note": {
    en: "You will be taken to a secure checkout page and returned here once the deposit is paid.",
    th: "ระบบจะพาไปหน้าชำระเงินที่ปลอดภัย และกลับมาที่นี่เมื่อชำระมัดจำแล้ว",
  },
  "bk.rail.wire": { en: "Bank transfer", th: "โอนผ่านธนาคาร" },
  "bk.rail.wire.sub": { en: "SWIFT or domestic", th: "SWIFT หรือในประเทศ" },
  "bk.rail.wire.note": {
    en: "We hold the room for 48 hours while your transfer arrives.",
    th: "เราถือห้องไว้ให้ 48 ชั่วโมงระหว่างรอเงินโอน",
  },
  "bk.rail.crypto": { en: "Crypto", th: "คริปโต" },
  "bk.rail.crypto.sub": { en: "BTC, ETH, USDC", th: "เหรียญ BTC, ETH, USDC" },
  "bk.rail.crypto.note": {
    en: "A hosted crypto checkout opens; the deposit confirms on chain.",
    th: "จะเปิดหน้าชำระคริปโต มัดจำยืนยันเมื่อธุรกรรมบนเชนสำเร็จ",
  },
  "bk.rail.live": { en: "Live", th: "ใช้งานจริง" },
  "bk.rail.demo": { en: "Demo", th: "ตัวอย่าง" },
  "bk.pay.scanLive": {
    en: "Scan with your banking app. Your room is held; the house marks the deposit received when the transfer lands.",
    th: "สแกนด้วยแอปธนาคารของคุณ ห้องถูกถือไว้แล้ว ทางบ้านจะบันทึกมัดจำเมื่อเงินเข้า",
  },
  "bk.pay.reference": { en: "Reference", th: "อ้างอิง" },
  "bk.pay.demoDone": {
    en: "Demo mode: the deposit was recorded without a real charge.",
    th: "โหมดตัวอย่าง: บันทึกมัดจำแล้วโดยไม่มีการเรียกเก็บเงินจริง",
  },
  "bk.pay.status.awaitScan": { en: "Deposit pending · scan the QR", th: "รอมัดจำ · สแกน QR" },
  "bk.pay.status.awaitWire": { en: "Deposit pending · bank transfer", th: "รอมัดจำ · โอนผ่านธนาคาร" },
  "bk.pay.status.paid": { en: "Deposit received", th: "ได้รับมัดจำแล้ว" },
  "bk.pay.status.demoPaid": { en: "Deposit recorded (demo)", th: "บันทึกมัดจำแล้ว (ตัวอย่าง)" },
  "bk.wire.bank": { en: "Bank", th: "ธนาคาร" },
  "bk.wire.account": { en: "Account name", th: "ชื่อบัญชี" },
  "bk.wire.number": { en: "Account number", th: "เลขที่บัญชี" },
  "bk.wire.note": {
    en: "Quote the reference on your transfer so the desk can match it to your stay.",
    th: "ระบุรหัสอ้างอิงในการโอน เพื่อให้ฟรอนต์จับคู่กับการเข้าพักของคุณได้",
  },
  "bk.paid.h1": { en: "Thank you · deposit received", th: "ขอบคุณค่ะ · ได้รับมัดจำแล้ว" },
  "bk.paid.p": {
    en: "Your room is confirmed. The receipt is on its way to your inbox, and the concierge knows your booking code.",
    th: "ห้องของคุณยืนยันแล้ว ใบเสร็จกำลังส่งไปที่อีเมล และคอนเซียร์จรู้รหัสจองของคุณแล้ว",
  },
  "bk.paid.cancelledH1": { en: "Payment not completed", th: "การชำระเงินยังไม่เสร็จ" },
  "bk.paid.cancelledP": {
    en: "No charge was made. Your booking is held for a short while; you can try another way to pay.",
    th: "ยังไม่มีการเรียกเก็บเงิน การจองถูกถือไว้ชั่วคราว คุณสามารถลองวิธีชำระอื่นได้",
  },
  "bk.paid.tryAgain": { en: "Try another way", th: "ลองวิธีอื่น" },
  "bk.err.taken": {
    en: "That room was just taken for these dates. Choose another room or shift your dates.",
    th: "ห้องนี้เพิ่งถูกจองไปสำหรับวันที่นี้ กรุณาเลือกห้องอื่นหรือเลื่อนวันที่",
  },
  "bk.err.minStay": { en: "These dates need a longer stay.", th: "วันที่นี้ต้องพักนานกว่านี้" },
  "bk.err.past": { en: "Check-in must be today or later.", th: "วันเช็คอินต้องเป็นวันนี้หรือหลังจากนี้" },
  "bk.err.generic": { en: "Something went wrong. Please try again.", th: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" },

  /* ── Home · signature packages ────────────────────────────────────────── */
  "sig.eyebrow": { en: "Bespoke", th: "ออกแบบเพื่อคุณ" },
  "sig.h2": { en: "Arrive by helicopter. Dine with your own chef.", th: "มาถึงด้วยเฮลิคอปเตอร์ ดินเนอร์กับเชฟส่วนตัวของคุณ" },
  "sig.p": {
    en: "Every stay can be composed: transfers, private dining, spa itineraries and the small things that make a house feel like yours.",
    th: "ทุกการเข้าพักออกแบบได้ ทั้งรถรับส่ง มื้ออาหารส่วนตัว โปรแกรมสปา และรายละเอียดเล็ก ๆ ที่ทำให้บ้านหลังนี้เป็นของคุณ",
  },
  "sig.cta": { en: "Compose your stay", th: "ออกแบบการเข้าพักของคุณ" },

  /* ── Currency ─────────────────────────────────────────────────────────── */
  "cur.liveNote": {
    en: "Shown in {c} at today's rate · charged in THB.",
    th: "แสดงเป็น {c} ตามอัตราวันนี้ · เรียกเก็บเป็น THB",
  },
  "cur.indicative": {
    en: "Shown in {c} at an indicative rate · charged in THB.",
    th: "แสดงเป็น {c} ตามอัตราโดยประมาณ · เรียกเก็บเป็น THB",
  },

  /* ── Concierge · in-stay mode ─────────────────────────────────────────── */
  "cg.stay.link": { en: "Your stay", th: "การเข้าพักของคุณ" },
  "cg.stay.codeLabel": { en: "Booking code", th: "รหัสการจอง" },
  "cg.stay.verify": { en: "Link", th: "เชื่อม" },
  "cg.stay.invalid": { en: "That code does not match a stay.", th: "รหัสนี้ไม่ตรงกับการจองใด" },
  "cg.stay.forget": { en: "Unlink", th: "ยกเลิกการเชื่อม" },
  "cg.stay.linked": {
    en: "Your stay is linked. Ask me for breakfast, a spa slot, a car, or a plan for the day · I send it straight to the desk.",
    th: "เชื่อมการเข้าพักแล้วค่ะ ขออาหารเช้า จองสปา เรียกรถ หรือให้วางแผนเที่ยวได้เลย น้ำจะส่งตรงถึงฟรอนต์ค่ะ",
  },
  "cg.req.sentToDesk": { en: "Sent to the desk", th: "ส่งถึงฟรอนต์แล้ว" },
  "cg.req.kind.room_service": { en: "Room service", th: "รูมเซอร์วิส" },
  "cg.req.kind.housekeeping": { en: "Housekeeping", th: "แม่บ้าน" },
  "cg.req.kind.spa": { en: "Spa", th: "สปา" },
  "cg.req.kind.transfer": { en: "Transfer", th: "รถรับส่ง" },
  "cg.req.kind.dining": { en: "Dining", th: "ห้องอาหาร" },
  "cg.req.kind.itinerary": { en: "Itinerary", th: "แผนการเดินทาง" },
  "cg.req.kind.other": { en: "Request", th: "คำขอ" },
  "cg.req.filed": {
    en: "Done · your {kind} request is with the desk as {ref}. They will confirm the time with you shortly.",
    th: "เรียบร้อยค่ะ · คำขอ{kind}ของคุณส่งถึงฟรอนต์แล้ว หมายเลข {ref} ทีมจะยืนยันเวลากับคุณในไม่ช้า",
  },
  "cg.req.filedShort": { en: "Done · it is with the desk now.", th: "เรียบร้อยค่ะ · ส่งถึงฟรอนต์แล้ว" },
  "cg.req.askWhat": {
    en: "Your stay is linked. Tell me what you would like · breakfast, housekeeping, a spa slot, a car, or a plan for the day.",
    th: "เชื่อมการเข้าพักแล้วค่ะ บอกน้ำได้เลยว่าต้องการอะไร · อาหารเช้า แม่บ้าน สปา รถ หรือแผนเที่ยว",
  },
};
