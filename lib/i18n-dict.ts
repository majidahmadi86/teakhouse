import { hotelConfig } from "@/config/hotel.config";

export type DictEntry = { en: string; th: string };

export const DICT: Record<string, DictEntry> = {
  "nav.rooms": { en: "Rooms", th: "ห้องพัก" },
  "nav.offers": { en: "Offers", th: "ข้อเสนอ" },
  "nav.experience": { en: "Experience", th: "ประสบการณ์" },
  "nav.gallery": { en: "Gallery", th: "แกลเลอรี" },
  "nav.location": { en: "Location", th: "การเดินทาง" },
  "nav.contact": { en: "Contact", th: "ติดต่อ" },
  "nav.book": { en: "Book direct", th: "จองตรง" },
  "brand.tag": { en: "Riverside Boutique Hotel · Bangkok", th: "โรงแรมบูทีคริมแม่น้ำ · กรุงเทพฯ" },
  "brand.name": { en: "The Teak House", th: "The Teak House" },

  "hero.eyebrow": { en: "Charoenkrung · Chao Phraya riverside", th: "เจริญกรุง · ริมแม่น้ำเจ้าพระยา" },
  "hero.h1": { en: "The river keeps its own time.", th: "ริมน้ำ ที่เวลาเดินช้าลง" },
  "hero.lead": {
    en: "Twelve teak rooms above the Chao Phraya. Book direct with us and always pay less than on any booking site.",
    th: "ห้องพักไม้สัก 12 ห้อง ริมแม่น้ำเจ้าพระยา จองตรงกับเรา ราคาถูกกว่าเว็บจองทุกที่ เสมอ",
  },
  "hero.leadShort": {
    en: "Twelve teak rooms above the Chao Phraya.",
    th: "ห้องพักไม้สัก 12 ห้อง ริมแม่น้ำเจ้าพระยา",
  },
  "avail.in": { en: "Check-in", th: "เช็คอิน" },
  "avail.out": { en: "Check-out", th: "เช็คเอาท์" },
  "avail.guests": { en: "Guests", th: "ผู้เข้าพัก" },
  "avail.go": { en: "Check rates", th: "เช็คราคา" },
  "avail.note": {
    en: "Best rate guaranteed · direct bookings are always cheaper than Agoda and Booking.com",
    th: "การันตีราคาดีที่สุด · จองตรงถูกกว่า Agoda และ Booking.com เสมอ",
  },
  "avail.dates": { en: "Dates", th: "วันที่" },
  "avail.selectDates": { en: "Select dates", th: "เลือกวันที่" },
  g1: { en: "1 guest", th: "1 ท่าน" },
  g2: { en: "2 guests", th: "2 ท่าน" },
  g3: { en: "3 guests", th: "3 ท่าน" },
  g4: { en: "4 guests", th: "4 ท่าน" },

  "about.eyebrow": { en: "A house, not a lobby", th: "บ้าน ไม่ใช่ล็อบบี้" },
  "about.h2": {
    en: "Golden teak, morning light, the sound of long-tail boats.",
    th: "ไม้สักทอง แสงยามเช้า และเสียงเรือหางยาว",
  },
  "about.p": {
    en: "A restored teak trading house from 1926, twelve rooms deep in the old riverside quarter. Breakfast on the pier, a small pool in the courtyard, and a team that remembers your name and your coffee.",
    th: "เรือนค้าไม้สักปี 2469 ที่ได้รับการบูรณะใหม่ 12 ห้องพักในย่านริมน้ำเก่าแก่ อาหารเช้าริมท่าเรือ สระว่ายน้ำเล็กๆ กลางคอร์ทยาร์ด และทีมงานที่จำชื่อคุณและกาแฟแก้วโปรดของคุณได้",
  },
  "about.cta": { en: "Our rooms", th: "ดูห้องพัก" },

  "rooms.eyebrow": { en: "Stay", th: "ห้องพัก" },
  "rooms.h2": { en: "Twelve rooms. No two alike.", th: "12 ห้อง ไม่มีห้องไหนเหมือนกัน" },
  "rooms.p": {
    en: "Every rate below is the direct price. The same room always costs more on Agoda or Booking.com, because they charge us commission and we would rather give that money back to you.",
    th: "ราคาด้านล่างคือราคาจองตรง ห้องเดียวกันบน Agoda หรือ Booking.com แพงกว่าเสมอ เพราะเว็บเหล่านั้นเก็บค่าคอมมิชชั่นจากเรา และเราเลือกคืนส่วนนั้นให้คุณแทน",
  },
  "rooms.all": { en: "See all rooms", th: "ดูห้องพักทั้งหมด" },
  "room.book": { en: "Book", th: "จอง" },
  "room.night": { en: "/ night", th: "/ คืน" },
  "room.see": { en: "See room", th: "ดูห้อง" },
  "room.from": { en: "from", th: "เริ่ม" },
  "chip.direct": { en: "Direct", th: "จองตรง" },
  "chip.via": { en: "on Agoda", th: "บน Agoda" },
  "chip.save": { en: "Save {z} per night", th: "ประหยัด {z} ต่อคืน" },
  "rooms.compare": { en: "Compare our rooms", th: "เปรียบเทียบห้องพัก" },
  "rooms.amenities": { en: "Amenities", th: "สิ่งอำนวยความสะดวก" },
  "rooms.other": { en: "Other rooms", th: "ห้องอื่นๆ" },
  "rooms.bookThis": { en: "Book this room", th: "จองห้องนี้" },
  "rooms.sleeps": { en: "Sleeps {n}", th: "พักได้ {n} ท่าน" },
  "cmp.size": { en: "Size", th: "ขนาด" },
  "cmp.bed": { en: "Bed", th: "เตียง" },
  "cmp.sleeps": { en: "Sleeps", th: "จำนวนผู้เข้าพัก" },
  "cmp.view": { en: "View", th: "วิว" },
  "cmp.bathtub": { en: "Bathtub", th: "อ่างอาบน้ำ" },
  "cmp.balcony": { en: "Balcony", th: "ระเบียง" },
  "cmp.pets": { en: "Pets", th: "สัตว์เลี้ยง" },
  "cmp.direct": { en: "Direct price", th: "ราคาจองตรง" },
  "cmp.agoda": { en: "Agoda price", th: "ราคา Agoda" },
  "cmp.yes": { en: "Yes", th: "มี" },
  "cmp.no": { en: "No", th: "ไม่มี" },

  "sys.eyebrow": { en: "Always on", th: "พร้อมเสมอ" },
  "sys.h2": { en: "The house never sleeps, so you can.", th: "บ้านหลังนี้ไม่เคยหลับ เพื่อให้คุณหลับสบาย" },
  "sys.p": {
    en: "Questions get answered and rooms get booked at any hour, in Thai or English, even when the front desk light is off.",
    th: "ทุกคำถามมีคำตอบ ทุกห้องจองได้ตลอด 24 ชั่วโมง ทั้งภาษาไทยและอังกฤษ แม้ไฟที่ฟรอนต์จะปิดแล้ว",
  },
  "sys.f1h": { en: "24/7 concierge", th: "คอนเซียร์จ 24 ชม." },
  "sys.f1p": {
    en: "Ask about rates, airport pickup or late check-in at 2am and get an instant answer, in your language.",
    th: "ถามราคา รถรับสนามบิน หรือเช็คอินดึกตอนตี 2 ก็ได้คำตอบทันที ในภาษาของคุณ",
  },
  "sys.f2h": { en: "Book direct, pay less", th: "จองตรง จ่ายน้อยกว่า" },
  "sys.f2p": {
    en: "Real-time availability, secure deposit by card or PromptPay, instant confirmation. No agency in between.",
    th: "เช็คห้องว่างเรียลไทม์ มัดจำผ่านบัตรหรือพร้อมเพย์ ยืนยันทันที ไม่ผ่านตัวกลาง",
  },
  "sys.f3h": { en: "Guests, not bookings", th: "แขก ไม่ใช่แค่ยอดจอง" },
  "sys.f3p": {
    en: "Tell us your arrival time, allergies or a special occasion. The house is ready before you knock.",
    th: "บอกเวลาถึง อาหารที่แพ้ หรือโอกาสพิเศษของคุณ บ้านหลังนี้พร้อมก่อนคุณเคาะประตู",
  },

  "rev.eyebrow": { en: "Guest words", th: "เสียงจากแขก" },
  "rev.h2": { en: "They came for the river. They stayed for the house.", th: "มาเพราะแม่น้ำ แต่ประทับใจเพราะบ้าน" },
  "rev.1": {
    en: "\"We asked about a late arrival at 1am and had an answer before the taxi moved. The room smelled of teak and the river was outside the window. We extended twice.\"",
    th: "\"ถามเรื่องเช็คอินดึกตอนตีหนึ่ง ได้คำตอบก่อนที่เราจะพิมพ์จบ ห้องหันหน้าออกแม่น้ำจริงอย่างที่บอก\"",
  },
  "rev.1a": { en: "Claire · Lyon", th: "Claire · ลียง" },
  "rev.2": {
    en: "\"Booked direct in two minutes, paid the deposit with PromptPay, got the confirmation instantly. Cheaper than the price I had open on Agoda in the next tab.\"",
    th: "\"จองตรงเสร็จในสองนาที จ่ายมัดจำด้วยพร้อมเพย์ ได้เลขห้องทันที ไม่มีอะไรให้ลุ้นเลย\"",
  },
  "rev.2a": { en: "ปริม · กรุงเทพฯ", th: "ปริม · กรุงเทพฯ" },
  "rev.3": {
    en: "\"Twelve rooms means the pier at breakfast is never crowded. The mango tree, the saltwater pool, the boats going by. It does not feel like a hotel. It feels like a house.\"",
    th: "\"มีแค่ 12 ห้อง ท่าเรือตอนเช้าจึงไม่เคยแน่น ต้นมะม่วงกลางคอร์ทยาร์ดคือเหตุผลที่เราจะกลับมาอีก\"",
  },
  "rev.3a": { en: "Daniel · Zürich", th: "Daniel · ซูริก" },

  "cta.h2": { en: "The river is waiting.", th: "แม่น้ำกำลังรอคุณอยู่" },
  "cta.p": {
    en: "Check tonight's rates in ten seconds. Direct is always the best price.",
    th: "เช็คราคาคืนนี้ใน 10 วินาที จองตรงคือราคาดีที่สุดเสมอ",
  },
  "cta.btn": { en: "Check rates", th: "เช็คราคา" },

  "ft.about": {
    en: "A 1926 teak trading house on the Chao Phraya, restored into twelve rooms. Charoenkrung 44, Bang Rak, Bangkok.",
    th: "เรือนค้าไม้สักปี 2469 ริมแม่น้ำเจ้าพระยา บูรณะเป็นห้องพัก 12 ห้อง เจริญกรุง 44 บางรัก กรุงเทพฯ",
  },
  "ft.stay": { en: "Stay", th: "ที่พัก" },
  "ft.visit": { en: "Visit", th: "ข้อมูล" },
  "ft.talk": { en: "Talk to us", th: "ติดต่อเรา" },
  "ft.rooms": { en: "Rooms and rates", th: "ห้องพักและราคา" },
  "ft.book": { en: "Book direct", th: "จองตรง" },
  "ft.exp": { en: "Experience", th: "ประสบการณ์" },
  "ft.loc": { en: "Getting here", th: "การเดินทาง" },
  "ft.faq": { en: "Good to know", th: "ข้อมูลน่ารู้" },
  "ft.fine": { en: "Demo concept by Mikaro Studio · not a real hotel", th: "เว็บไซต์ตัวอย่างโดย Mikaro Studio · ไม่ใช่โรงแรมจริง" },
  "ft.copy": { en: "© The Teak House · demo by Mikaro Studio", th: "© The Teak House · ตัวอย่างโดย Mikaro Studio" },
  "ft.pay": { en: "Visa · Mastercard · PromptPay", th: "Visa · Mastercard · PromptPay" },
  "ft.story": {
    en: "Twelve rooms. One river. Always better direct.",
    th: "12 ห้อง หนึ่งแม่น้ำ จองตรงดีที่สุดเสมอ",
  },

  "dm.h3": { en: "You are inside a working system", th: "นี่คือระบบที่ทำงานได้จริง" },
  "dm.p": {
    en: "The Teak House is a live demo by Mikaro Studio. Everything on this site works right now:",
    th: "The Teak House คือเว็บตัวอย่างที่ใช้งานได้จริงโดย Mikaro Studio ทุกอย่างในเว็บนี้ทำงานจริง:",
  },
  "dm.l1": {
    en: "Direct booking with deposit · guests stop paying OTA prices",
    th: "ระบบจองตรงพร้อมมัดจำ · แขกไม่ต้องจ่ายราคา OTA",
  },
  "dm.l2": {
    en: "24/7 concierge answering in Thai and English",
    th: "คอนเซียร์จตอบอัตโนมัติ 24 ชม. ทั้งไทยและอังกฤษ",
  },
  "dm.l3": {
    en: "Owner dashboard with bookings, availability and commission saved",
    th: "แดชบอร์ดเจ้าของ ดูยอดจอง ห้องว่าง และค่าคอมมิชชั่นที่ประหยัดได้",
  },
  "dm.cta": { en: "Explore the demo", th: "ชมเว็บตัวอย่าง" },
  "dm.owner": { en: "Open the owner dashboard", th: "เปิดแดชบอร์ดเจ้าของ" },

  "db.viewing": { en: "Viewing:", th: "มุมมอง:" },
  "db.guest": { en: "Guest site", th: "หน้าเว็บลูกค้า" },
  "db.owner": { en: "Owner panel", th: "ระบบหลังบ้าน" },
  "db.cta": {
    en: "Get this for your property",
    th: "รับเว็บแบบนี้สำหรับที่พักของคุณ",
  },
  "db.ctaShort": { en: "Get this", th: "รับเว็บแบบนี้" },
  "do.title": {
    en: "A site like this, for your property",
    th: "เว็บแบบนี้ สำหรับที่พักของคุณ",
  },
  "do.line": {
    en: "Direct bookings, owner dashboard and AI concierge · designed, launched and maintained by Mikaro Studio.",
    th: "ระบบจองตรง พร้อมหลังบ้านและ AI ผู้ช่วย · ออกแบบ ติดตั้ง และดูแลโดย Mikaro Studio",
  },
  "do.primary": { en: "Chat on LINE", th: "คุยทาง LINE" },
  "do.secondary": { en: "Platform details", th: "รายละเอียดแพลตฟอร์ม" },
  "ow.demoData": {
    en: "Demo data · resets hourly",
    th: "ข้อมูลตัวอย่าง · รีเซ็ตทุกชั่วโมง",
  },

  "rp.h1": { en: "Rooms and rates", th: "ห้องพักและราคา" },
  "rp.lead": {
    en: "Four room types, twelve rooms in the house. Direct rates below beat every booking site, every night.",
    th: "ห้องพัก 4 แบบ รวม 12 ห้อง ราคาจองตรงด้านล่างถูกกว่าทุกเว็บจอง ทุกคืน",
  },
  "rp.r1p": {
    en: "The top floor to yourself: golden teak, a king bed facing the water, and a balcony where the river traffic is the evening show.",
    th: "ชั้นบนสุดเป็นของคุณ ไม้สักทอง เตียงคิงหันหน้าสู่แม่น้ำ และระเบียงที่วิวเรือคือโชว์ยามค่ำ",
  },
  "rp.r2p": {
    en: "The house's original master room. High ceilings, a deep soaking tub, and the smell of old teak after rain.",
    th: "ห้องมาสเตอร์ดั้งเดิมของบ้าน เพดานสูง อ่างอาบน้ำลึก และกลิ่นไม้สักเก่าหลังฝนตก",
  },
  "rp.r3p": {
    en: "Opens onto the courtyard and the mango tree. Quiet, green, and five steps from the pool.",
    th: "เปิดสู่คอร์ทยาร์ดและต้นมะม่วง เงียบสงบ ร่มรื่น ห่างจากสระน้ำเพียง 5 ก้าว",
  },
  "rp.r4p": {
    en: "Two proper single beds, a writing desk, and morning light. The traveller's favorite.",
    th: "เตียงเดี่ยว 2 เตียง โต๊ะเขียนหนังสือ และแสงยามเช้า ห้องโปรดของนักเดินทาง",
  },
  "rp.inc": { en: "All rooms include", th: "ทุกห้องรวม" },
  "rp.i1": { en: "Breakfast on the pier", th: "อาหารเช้าริมท่าเรือ" },
  "rp.i2": { en: "Fast Wi-Fi and workspace", th: "Wi-Fi เร็วและมุมทำงาน" },
  "rp.i3": { en: "Saltwater courtyard pool", th: "สระน้ำเกลือกลางคอร์ทยาร์ด" },
  "rp.i4": { en: "24-hour house desk", th: "ฟรอนต์ดูแล 24 ชั่วโมง" },
  "rp.i5": { en: "Free cancellation to 3 days", th: "ยกเลิกฟรีก่อนเข้าพัก 3 วัน" },
  "rp.i6": { en: "Filtered water, no plastic", th: "น้ำดื่มกรองสะอาด ไร้พลาสติก" },

  "xp.h1": { en: "Days by the river", th: "วันสบายๆ ริมแม่น้ำ" },
  "xp.lead": {
    en: "Slow mornings, golden afternoons, and a neighborhood that still belongs to its people.",
    th: "เช้าที่เนิบช้า บ่ายสีทอง และย่านเก่าที่ยังเป็นของผู้คนจริงๆ",
  },
  "xp.1h": { en: "Breakfast on the pier", th: "อาหารเช้าริมท่าเรือ" },
  "xp.1p": {
    en: "07:00 to 11:00 · rice soup, mango with sticky rice, eggs any way, Chiang Rai coffee. The boats go by, you stay put.",
    th: "07:00 ถึง 11:00 น. · ข้าวต้ม ข้าวเหนียวมะม่วง ไข่ตามสั่ง กาแฟเชียงราย เรือแล่นผ่านไป ส่วนคุณนั่งสบายอยู่ตรงนี้",
  },
  "xp.1p2": {
    en: "Everything is made when you sit down, nothing from a buffet tray. Tell us the evening before if you want it packed for an early boat.",
    th: "ทุกจานปรุงสดเมื่อคุณนั่งลง ไม่มีอะไรจากถาดบุฟเฟ่ต์ หากต้องการห่อไปทานบนเรือรอบเช้า บอกเราล่วงหน้าหนึ่งคืนได้เลย",
  },
  "xp.2h": { en: "The courtyard pool", th: "สระน้ำกลางคอร์ทยาร์ด" },
  "xp.2p": {
    en: "Saltwater, shaded by a fifty-year-old mango tree. Open 07:00 to 21:00, towels at the pool house.",
    th: "สระน้ำเกลือใต้ร่มต้นมะม่วงอายุ 50 ปี เปิด 07:00 ถึง 21:00 น. มีผ้าเช็ดตัวที่ศาลาริมสระ",
  },
  "xp.2p2": {
    en: "Morning laps before the heat, or a slow float at dusk when the birds come back to the mango tree.",
    th: "ว่ายน้ำยามเช้าก่อนแดดแรง หรือลอยตัวช้าๆ ยามเย็นตอนนกบินกลับรังบนต้นมะม่วง",
  },
  "xp.3h": { en: "Thai massage upstairs", th: "นวดไทยชั้นบน" },
  "xp.3p": {
    en: "Two teak rooms, two sisters from Wat Pho school, oils from Chiang Mai. Book a slot at the desk or with the concierge.",
    th: "ห้องไม้สัก 2 ห้อง หมอนวด 2 พี่น้องจากสายวัดโพธิ์ น้ำมันหอมจากเชียงใหม่ จองคิวที่ฟรอนต์หรือผ่านคอนเซียร์จได้เลย",
  },
  "xp.3p2": {
    en: "Sixty or ninety minutes, in the room or upstairs. Book by evening for the next day.",
    th: "เลือกได้ 60 หรือ 90 นาที ในห้องพักหรือชั้นบน จองภายในช่วงเย็นสำหรับวันถัดไป",
  },
  "xp.4h": { en: "Evening long-tail ride", th: "ล่องเรือหางยาวยามเย็น" },
  "xp.4p": {
    en: "One hour through the Thonburi canals at golden hour, from our own pier. ฿600 per person, ask the concierge.",
    th: "ล่องคลองฝั่งธนฯ 1 ชั่วโมงช่วงแสงทอง ออกจากท่าเรือของเราเอง ท่านละ 600.- สอบถามคอนเซียร์จได้เลย",
  },
  "xp.4p2": {
    en: "Private long-tail from our own pier through Thonburi's canals, life jackets and cold water included.",
    th: "เรือหางยาวส่วนตัวจากท่าเรือของเราเอง ล่องคลองฝั่งธนฯ พร้อมเสื้อชูชีพและน้ำเย็นบนเรือ",
  },
  "xp.cta": { en: "Stay with us", th: "มาพักกับเรา" },
  "xp.ask": { en: "Ask the concierge", th: "ถามคอนเซียร์จ" },
  "xp.nbh": { en: "The neighborhood, on foot", th: "ย่านนี้ ในระยะเดิน" },
  "xp.n1": { en: "Shophouse cafes", th: "คาเฟ่ตึกแถวเก่า" },
  "xp.n2": { en: "Dawn flower market", th: "ตลาดดอกไม้ยามเช้า" },
  "xp.n3": { en: "Warehouse galleries", th: "แกลเลอรีในโกดังเก่า" },
  "xp.n4": { en: "Street food", th: "สตรีทฟู้ด" },

  "lc.h1": { en: "Getting here", th: "การเดินทาง" },
  "lc.lead": {
    en: "Charoenkrung 44, Bang Rak. On the river, in the middle of old Bangkok, six minutes from the BTS.",
    th: "เจริญกรุง 44 บางรัก ริมแม่น้ำ ใจกลางกรุงเทพฯ ย่านเก่า ห่าง BTS เพียง 6 นาที",
  },
  "lc.1h": { en: "By skytrain", th: "รถไฟฟ้า BTS" },
  "lc.1p": {
    en: "BTS Saphan Taksin, exit 2. Walk north along Charoenkrung for six minutes; the brass leaf sign marks our lane.",
    th: "BTS สะพานตากสิน ทางออก 2 เดินขึ้นเหนือเลียบถนนเจริญกรุง 6 นาที มองหาป้ายใบไม้ทองเหลืองหน้าซอยของเรา",
  },
  "lc.2h": { en: "By river boat", th: "เรือด่วนเจ้าพระยา" },
  "lc.2p": {
    en: "Chao Phraya Express to Oriental Pier (N1), then three minutes on foot. The prettiest way to arrive.",
    th: "เรือด่วนเจ้าพระยาลงท่าโอเรียนเต็ล (N1) แล้วเดินต่อ 3 นาที เป็นเส้นทางมาถึงที่สวยที่สุด",
  },
  "lc.3h": { en: "From the airport", th: "จากสนามบิน" },
  "lc.3p": {
    en: "Private sedan from Suvarnabhumi ฿1,200 or Don Mueang ฿1,000, any hour. Send your flight number after booking and the driver waits with your name.",
    th: "รถส่วนตัวจากสุวรรณภูมิ 1,200.- หรือดอนเมือง 1,000.- ได้ทุกเวลา ส่งเลขเที่ยวบินหลังจอง คนขับจะรอพร้อมป้ายชื่อคุณ",
  },
  "lc.4h": { en: "The neighborhood", th: "ย่านของเรา" },
  "lc.4p": {
    en: "Old shophouse cafes, the flower market at dawn, galleries in converted warehouses, and some of the best street food in Bangkok, all on foot.",
    th: "คาเฟ่ตึกแถวเก่า ตลาดดอกไม้ยามเช้าตรู่ แกลเลอรีในโกดังเก่า และสตรีทฟู้ดที่อร่อยที่สุดแห่งหนึ่งของกรุงเทพฯ เดินถึงทั้งหมด",
  },
  "lc.map": { en: "Open in Google Maps", th: "เปิดใน Google Maps" },
  "lc.route": { en: "Open route in Google Maps", th: "เปิดเส้นทางใน Google Maps" },
  "lc.dir": { en: "From the airport / BTS / boat", th: "จากสนามบิน / BTS / เรือ" },

  "bk.h1": { en: "Book direct", th: "จองตรงกับเรา" },
  "bk.lead": {
    en: "Two minutes, a small deposit, and the room is yours. Always cheaper than any booking site.",
    th: "2 นาที มัดจำเล็กน้อย ห้องเป็นของคุณทันที ถูกกว่าทุกเว็บจองเสมอ",
  },
  "bk.s1": { en: "Dates", th: "วันที่" },
  "bk.s2": { en: "Room", th: "ห้อง" },
  "bk.s3": { en: "Deposit", th: "มัดจำ" },
  "bk.s4": { en: "Confirmed", th: "ยืนยันแล้ว" },
  "bk.when": { en: "When are you coming?", th: "มาพักวันไหนดีคะ" },
  "bk.cancel": { en: "Free cancellation up to 3 days before arrival.", th: "ยกเลิกฟรีก่อนเข้าพัก 3 วัน" },
  "bk.seeRooms": { en: "See available rooms", th: "ดูห้องว่าง" },
  "bk.choose": { en: "Choose your room", th: "เลือกห้องของคุณ" },
  "bk.nights": { en: "nights", th: "คืน" },
  "bk.night": { en: "night", th: "คืน" },
  "bk.continue": { en: "Continue to deposit", th: "ไปหน้ามัดจำ" },
  "bk.secure": { en: "Secure your room", th: "ยืนยันห้องของคุณ" },
  "bk.name": { en: "Full name", th: "ชื่อ-นามสกุล" },
  "bk.nameph": { en: "As on your passport or ID", th: "ตามพาสปอร์ตหรือบัตรประชาชน" },
  "bk.mail": { en: "Email or LINE", th: "อีเมลหรือ LINE" },
  "bk.save": { en: "You save vs Agoda", th: "ประหยัดกว่า Agoda" },
  "bk.dep": { en: "Deposit today (30%)", th: "มัดจำวันนี้ (30%)" },
  "bk.bal": { en: "Balance at check-in", th: "ส่วนที่เหลือชำระตอนเช็คอิน" },
  "bk.card": { en: "Card", th: "บัตรเครดิต" },
  "bk.scan": { en: "Scan with any Thai banking app", th: "สแกนด้วยแอปธนาคารใดก็ได้" },
  "bk.pay": { en: "Pay deposit", th: "ชำระมัดจำ" },
  "bk.demo": { en: "Demo mode: no real payment is taken.", th: "โหมดตัวอย่าง: ไม่มีการชำระเงินจริง" },
  "bk.done": { en: "Booking confirmed", th: "ยืนยันการจองแล้ว" },
  "bk.sent": {
    en: "Confirmation sent by email and LINE. Tell the concierge your arrival time and the house will be ready.",
    th: "ส่งการยืนยันทางอีเมลและ LINE แล้วค่ะ บอกเวลาถึงกับคอนเซียร์จได้เลย บ้านจะพร้อมรอคุณ",
  },
  "bk.back": { en: "Back to the house", th: "กลับหน้าแรก" },
  "bk.backStep": { en: "← Back", th: "← กลับ" },
  "bk.phone": { en: "Phone", th: "โทรศัพท์" },
  "bk.viewDetails": { en: "View details", th: "ดูรายละเอียด" },
  "bk.select": { en: "Select", th: "เลือก" },
  "bk.receipt": { en: "Booking receipt", th: "ใบยืนยันการจอง" },
  "bk.showCheckin": { en: "Show this at check-in", th: "แสดงใบนี้ตอนเช็คอิน" },
  "bk.print": { en: "Print / Save PDF", th: "พิมพ์ / บันทึก PDF" },
  "bk.summary": { en: "Your stay", th: "การเข้าพักของคุณ" },
  "bk.helperDates": {
    en: "1st click: check-in · 2nd: check-out",
    th: "คลิกแรก: เช็คอิน · คลิกที่สอง: เช็คเอาท์",
  },
  "bk.nightsCount": { en: "{n} nights", th: "{n} คืน" },
  "trust.1": { en: "Best rate guaranteed", th: "การันตีราคาดีที่สุด" },
  "trust.2": { en: "Free cancellation to 3 days", th: "ยกเลิกฟรีก่อน 3 วัน" },
  "trust.3": { en: "Instant confirmation", th: "ยืนยันทันที" },
  "trust.4": { en: "No booking fees", th: "ไม่มีค่าธรรมเนียมการจอง" },
  "urg.loft": { en: "Only 2 left at this price", th: "เหลือ 2 ห้องราคานี้" },
  "urg.garden": { en: "Popular choice", th: "ห้องยอดนิยม" },
  // v11 · facilities + house & team. EN in both slots until the Thai pass ·
  // see docs/v11-th-keys.md.
  "nav.facilities": { en: "Facilities", th: "สิ่งอำนวยความสะดวก" },
  "fac.h1": { en: "What the house keeps for you", th: "สิ่งที่บ้านหลังนี้เตรียมไว้ให้คุณ" },
  "fac.lead": {
    en: "Seven things we look after, so that none of them is your problem while you are here.",
    th: "เจ็ดสิ่งที่เราดูแลไว้ให้ เพื่อไม่ให้เรื่องเหล่านี้กลายเป็นภาระของคุณตอนมาพัก",
  },
  "fac.pool.h": { en: "The courtyard pool", th: "สระว่ายน้ำกลางคอร์ทยาร์ด" },
  "fac.pool.p": {
    en: "Saltwater, shaded by the old mango tree, open 07:00 to 21:00.",
    th: "สระน้ำเกลือใต้ร่มต้นมะม่วงเก่าแก่ เปิด 07:00 ถึง 21:00",
  },
  "fac.pool.p2": {
    en: "Towels are in the pool house and no one has ever needed to reserve a chair.",
    th: "ผ้าเช็ดตัวอยู่ที่ศาลาริมสระ และยังไม่เคยมีใครต้องจองเก้าอี้",
  },
  "fac.pier.h": { en: "Breakfast on the river pier", th: "อาหารเช้าที่ท่าเรือ" },
  "fac.pier.p": {
    en: "Laid on the pier from 07:00 to 11:00, while the first ferries cross.",
    th: "จัดไว้ที่ท่าเรือ 07:00 ถึง 11:00 ช่วงที่เรือข้ามฟากเที่ยวแรกเริ่มออก",
  },
  "fac.pier.p2": {
    en: "Rice soup, fruit cut that morning, eggs to order, coffee roasted in Chiang Rai.",
    th: "ข้าวต้ม ผลไม้หั่นสดเช้านั้น ไข่ตามสั่ง และกาแฟคั่วจากเชียงราย",
  },
  "fac.garden.h": { en: "The courtyard garden", th: "สวนกลางคอร์ทยาร์ด" },
  "fac.garden.p": {
    en: "A walled garden of frangipani and ferns, cool enough to sit in at midday.",
    th: "สวนล้อมกำแพงที่มีลีลาวดีและเฟิร์น ร่มพอให้นั่งได้แม้ตอนเที่ยง",
  },
  "fac.garden.p2": {
    en: "It is where guests sit down with a book and lose the afternoon.",
    th: "เป็นมุมที่แขกหยิบหนังสือมานั่งแล้วเผลอหมดไปทั้งบ่าย",
  },
  "fac.lounge.h": { en: "The lobby lounge", th: "เลานจ์ที่ล็อบบี้" },
  "fac.lounge.p": {
    en: "The old front room, kept as it was: teak floors, deep chairs, quiet fans.",
    th: "ห้องรับแขกเดิมของบ้าน เก็บไว้อย่างที่เคยเป็น พื้นไม้สัก เก้าอี้นวมลึก และพัดลมที่หมุนเบา ๆ",
  },
  "fac.lounge.p2": {
    en: "Tea all day, a small bar from six, and someone at the desk around the clock.",
    th: "มีชาทั้งวัน บาร์เล็ก ๆ เปิดตั้งแต่หกโมงเย็น และมีคนอยู่ที่เคาน์เตอร์ตลอด 24 ชั่วโมง",
  },
  "fac.transfer.h": { en: "Airport transfer", th: "รถรับส่งสนามบิน" },
  "fac.transfer.p": {
    en: "A private car to either airport at any hour, arranged when you book.",
    th: "รถส่วนตัวไปได้ทั้งสองสนามบิน ทุกช่วงเวลา จัดให้ตั้งแต่ตอนคุณจองห้อง",
  },
  "fac.transfer.p2": {
    en: "The driver waits inside the terminal with your name on a teak board.",
    th: "คนขับรอในอาคารผู้โดยสาร พร้อมป้ายไม้สักที่มีชื่อของคุณ",
  },
  "fac.housekeeping.h": { en: "Daily housekeeping", th: "แม่บ้านดูแลทุกวัน" },
  "fac.housekeeping.p": {
    en: "Rooms made up each morning and turned down again in the evening.",
    th: "จัดห้องให้ทุกเช้า และเก็บเตียงให้อีกครั้งในช่วงเย็น",
  },
  "fac.housekeeping.p2": {
    en: "Linen is changed when you ask for it rather than on a fixed schedule.",
    th: "เปลี่ยนผ้าปูเมื่อคุณบอก ไม่ใช่ตามตารางที่ตั้งไว้",
  },
  "fac.luggage.h": { en: "Luggage storage", th: "รับฝากกระเป๋า" },
  "fac.luggage.p": {
    en: "Arrive before check-in or leave long after check-out, either is fine.",
    th: "มาถึงก่อนเวลาเช็คอิน หรือออกไปเที่ยวหลังเช็คเอาท์ ได้ทั้งสองอย่าง",
  },
  "fac.luggage.p2": {
    en: "Bags stay locked behind the desk, tagged, for as long as you need them to.",
    th: "กระเป๋าเก็บล็อกไว้หลังเคาน์เตอร์ ติดป้ายชื่อ ฝากได้นานเท่าที่คุณต้องการ",
  },
  "fac.strip.eyebrow": { en: "Facilities", th: "สิ่งอำนวยความสะดวก" },
  "fac.strip.h2": { en: "The house looks after the rest", th: "เรื่องที่เหลือ ให้บ้านหลังนี้ดูแล" },
  "fac.strip.p": {
    en: "A pool in the courtyard, breakfast on the pier, a car to the airport, and your bags kept safe either side of your stay.",
    th: "สระว่ายน้ำกลางคอร์ทยาร์ด อาหารเช้าที่ท่าเรือ รถไปสนามบิน และที่เก็บกระเป๋าให้ทั้งก่อนและหลังเข้าพัก",
  },
  "fac.strip.cta": { en: "See all facilities", th: "ดูสิ่งอำนวยความสะดวกทั้งหมด" },

  "house.eyebrow": { en: "House & team", th: "บ้านและผู้คน" },
  "house.h1": { en: "The house and the people in it", th: "บ้านหลังนี้ และคนที่อยู่ในนั้น" },
  "house.h2": { en: "Built in 1926. Still standing, still full.", th: "สร้างปี 1926 ยังตั้งอยู่ และยังมีคนพักเต็ม" },
  "house.p1": {
    en: "A teak trading house on Charoenkrung 44, put up in 1926 when the river was the road and this quarter shipped hardwood downstream. Twelve rooms, one staircase, and floorboards that announce every guest who comes home late.",
    th: "บ้านค้าไม้สักบนเจริญกรุง 44 สร้างขึ้นปี 1926 สมัยที่แม่น้ำยังเป็นถนน และย่านนี้ยังส่งไม้เนื้อแข็งล่องลงไปตามน้ำ 12 ห้อง บันไดหนึ่งช่วง และพื้นไม้ที่ส่งเสียงบอกทุกครั้งที่มีแขกกลับดึก",
  },
  "house.p2": {
    en: "It sat empty for most of the nineties. The restoration kept what was worth keeping: the shutters, the teak, the pier, the mango tree in the courtyard. Everything else was rebuilt around them.",
    th: "บ้านหลังนี้ถูกปล่อยว่างเกือบทั้งยุคเก้าศูนย์ การบูรณะเก็บสิ่งที่ควรเก็บไว้ทั้งหมด บานเกล็ด ไม้สัก ท่าเรือ และต้นมะม่วงกลางคอร์ทยาร์ด ส่วนอื่นสร้างขึ้นใหม่รอบสิ่งเหล่านั้น",
  },
  "house.p3": {
    en: "We run it with a small team and no front-of-house theatre. Book direct and the money stays in the building, which is how the roof gets fixed.",
    th: "เราดูแลบ้านกันด้วยทีมเล็ก ๆ ไม่มีพิธีรีตองหน้าเคาน์เตอร์ จองตรงกับเราแล้วเงินอยู่กับบ้านหลังนี้ ซึ่งเป็นวิธีที่หลังคาได้รับการซ่อม",
  },
  "house.teamH": { en: "Who you will meet", th: "คนที่คุณจะได้เจอ" },
  "house.teamP": {
    en: "Four people keep the house running. You will know all of them by the second morning.",
    th: "สี่คนนี้ดูแลบ้านทั้งหลัง เช้าวันที่สองคุณจะรู้จักทุกคนแล้ว",
  },
  "house.r1n": { en: "Khun Nok", th: "คุณนก" },
  "house.r1r": { en: "General manager", th: "ผู้จัดการทั่วไป" },
  "house.r1p": {
    en: "Runs the house and knows every creak in the floor. If something is wrong, say so before you leave.",
    th: "ดูแลบ้านทั้งหลัง และรู้จักเสียงลั่นของพื้นไม้ทุกจุด ถ้ามีอะไรไม่เรียบร้อย บอกได้ก่อนกลับ",
  },
  "house.r2n": { en: "Khun Nam", th: "คุณน้ำ" },
  "house.r2r": { en: "Concierge", th: "พนักงานต้อนรับ" },
  "house.r2p": {
    en: "Books the boats, the tables, and the car to the airport. Also answers the chat on this site, day and night.",
    th: "จัดเรือ จัดโต๊ะ และจัดรถไปสนามบิน รวมถึงเป็นคนตอบแชตบนเว็บนี้ ทั้งกลางวันและกลางคืน",
  },
  "house.r3n": { en: "Khun Toy", th: "คุณต้อย" },
  "house.r3r": { en: "Housekeeping lead", th: "หัวหน้าแม่บ้าน" },
  "house.r3p": {
    en: "Twelve rooms, turned twice a day. Flags a tired mattress long before a guest would notice it.",
    th: "12 ห้อง จัดวันละสองรอบ รู้ก่อนแขกเสมอว่าที่นอนไหนเริ่มยวบ",
  },
  "house.r4n": { en: "Khun Chai", th: "คุณชัย" },
  "house.r4r": { en: "Breakfast cook", th: "พ่อครัวอาหารเช้า" },
  "house.r4p": {
    en: "On the pier from six, cutting fruit. The rice soup is why people come down early.",
    th: "อยู่ที่ท่าเรือตั้งแต่หกโมง คอยหั่นผลไม้ ข้าวต้มของเขาคือเหตุผลที่คนลงมาเช้า",
  },
  "house.demoNote": {
    en: "Demo property · team members are illustrative roles, not real individuals.",
    th: "เว็บตัวอย่าง · รายชื่อทีมงานเป็นตัวอย่างของตำแหน่งงาน ไม่ใช่บุคคลจริง",
  },

  // v11 · concierge availability answers. EN in both slots until the Thai
  // pass · see docs/v11-th-keys.md.
  "cg.av.head": { en: "{in} to {out} · {n} {unit}.", th: "{in} ถึง {out} · {n} {unit}" },
  "cg.av.free": { en: "Free for those dates:", th: "ว่างสำหรับวันที่นี้ค่ะ:" },
  "cg.av.room": {
    en: "{room} at {nightly} a night, {total} total",
    th: "{room} คืนละ {nightly} รวม {total}",
  },
  "cg.av.nightlyRange": { en: "{lo} to {hi}", th: "{lo} ถึง {hi}" },
  "cg.av.mixed": {
    en: "Rates differ by date across your stay.",
    th: "ราคาต่อคืนไม่เท่ากันในช่วงที่คุณพักค่ะ",
  },
  "cg.av.none": {
    en: "Nothing is free for those dates.",
    th: "วันที่นี้ไม่มีห้องว่างค่ะ",
  },
  "cg.av.alt": {
    en: "The nearest free nights are {in} to {out}, from {total}.",
    th: "คืนที่ว่างใกล้ที่สุดคือ {in} ถึง {out} เริ่มที่ {total} ค่ะ",
  },
  "cg.av.noAlt": {
    en: "Nothing close is free either · tell me other dates and I will look again.",
    th: "ช่วงใกล้กันก็ไม่ว่างเลยค่ะ · บอกวันอื่นมาได้ น้ำจะลองหาให้อีกครั้ง",
  },
  "cg.av.book": { en: "Book these dates", th: "จองวันที่นี้" },
  "cg.av.checking": {
    en: "Let me check the book and come back to you.",
    th: "ขอเช็คในสมุดจองแล้วกลับมาบอกนะคะ",
  },

  // v11 · concierge date vocabulary. These are PARSER INPUT, not UI copy:
  // pipe-separated spellings the concierge accepts when reading dates out of a
  // guest message. The `th` side currently mirrors `en`, which already covers
  // the common Thai-locale case ("20-22 Aug"); filling in Thai spellings turns
  // Thai date parsing on with no code change. See docs/v11-th-keys.md.
  "date.mon.jan": { en: "jan|january", th: "มกราคม|ม.ค.|มค" },
  "date.mon.feb": { en: "feb|february", th: "กุมภาพันธ์|ก.พ.|กพ" },
  "date.mon.mar": { en: "mar|march", th: "มีนาคม|มี.ค.|มีค" },
  "date.mon.apr": { en: "apr|april", th: "เมษายน|เม.ย.|เมย" },
  "date.mon.may": { en: "may", th: "พฤษภาคม|พ.ค.|พค" },
  "date.mon.jun": { en: "jun|june", th: "มิถุนายน|มิ.ย.|มิย" },
  "date.mon.jul": { en: "jul|july", th: "กรกฎาคม|ก.ค.|กค" },
  "date.mon.aug": { en: "aug|august", th: "สิงหาคม|ส.ค.|สค" },
  "date.mon.sep": { en: "sep|sept|september", th: "กันยายน|ก.ย.|กย" },
  "date.mon.oct": { en: "oct|october", th: "ตุลาคม|ต.ค.|ตค" },
  "date.mon.nov": { en: "nov|november", th: "พฤศจิกายน|พ.ย.|พย" },
  "date.mon.dec": { en: "dec|december", th: "ธันวาคม|ธ.ค.|ธค" },
  "date.weekend": { en: "this weekend|the weekend|weekend", th: "สุดสัปดาห์นี้|สุดสัปดาห์|เสาร์อาทิตย์นี้|เสาร์อาทิตย์" },
  "date.nextWeekend": { en: "next weekend", th: "สุดสัปดาห์หน้า|เสาร์อาทิตย์หน้า" },
  // "คืนนี้" already ships in the concierge intent matcher · reused, not new.
  "date.tonight": { en: "tonight|today", th: "tonight|today|คืนนี้" },
  "date.tomorrow": { en: "tomorrow", th: "พรุ่งนี้" },
  "date.nextWeek": { en: "next week", th: "สัปดาห์หน้า|อาทิตย์หน้า" },
  "date.nights": { en: "night|nights", th: "night|nights|คืน" },

  // v11 · per-day pricing. EN in both slots until the Thai pass · see
  // docs/v11-th-keys.md.
  "bk.stayTotal": { en: "Stay total", th: "รวมทั้งการเข้าพัก" },
  "bk.perNight": { en: "Price per night", th: "ราคาต่อคืน" },
  "bk.mixedNote": {
    en: "Nightly rates differ across your stay · the total is the sum of each night.",
    th: "ราคาต่อคืนในช่วงที่คุณพักไม่เท่ากัน · ยอดรวมคือผลบวกของแต่ละคืน",
  },
  "bk.cardNum": { en: "Card number", th: "หมายเลขบัตร" },
  "bk.expiry": { en: "Expiry", th: "หมดอายุ" },

  "cg.fab": { en: "Concierge · 24/7", th: "คอนเซียร์จ · 24 ชม." },
  "cg.name": { en: "Nam · The Teak House", th: "น้ำ · The Teak House" },
  "cg.online": { en: "Online · replies instantly", th: "ออนไลน์ · ตอบทันที" },
  "cg.ph": { en: "Ask anything, any hour…", th: "ถามได้ทุกเรื่อง ทุกเวลา…" },

  "mobile.book": { en: "Book direct · from {z}", th: "จองตรง · เริ่ม {z}" },
  "mobile.menu": { en: "Menu", th: "เมนู" },
  "mobile.close": { en: "Close", th: "ปิด" },

  "ow.eyebrow": { en: "The Teak House · owner view", th: "The Teak House · มุมมองเจ้าของ" },
  "ow.h1": { en: "Good evening, Khun Nok", th: "สวัสดีตอนเย็นค่ะ คุณนก" },
  "ow.lead": {
    en: "Tonight the house is nearly full, and most of it booked direct. This is the panel your team uses every day: bookings, availability, and the money OTAs no longer take.",
    th: "คืนนี้บ้านเกือบเต็ม และส่วนใหญ่จองตรง นี่คือแผงควบคุมที่ทีมของคุณใช้ทุกวัน ดูยอดจอง ห้องว่าง และเงินที่ OTA ไม่ได้หักไปอีกต่อไป",
  },
  "ow.s1": { en: "Tonight's occupancy", th: "อัตราเข้าพักคืนนี้" },
  "ow.s2": { en: "Arrivals today", th: "เช็คอินวันนี้" },
  "ow.s3": { en: "Direct bookings · Aug", th: "จองตรง · ส.ค." },
  "ow.s4": { en: "OTA commission saved · Aug", th: "ค่าคอมฯ OTA ที่ประหยัดได้ · ส.ค." },
  "ow.s4sub": { en: "18% that stayed in the house", th: "18% ที่ยังอยู่กับบ้านหลังนี้" },
  "ow.bk": { en: "Bookings", th: "การจอง" },
  "ow.all": { en: "All sources", th: "ทุกช่องทาง" },
  "ow.direct": { en: "Direct only", th: "จองตรงเท่านั้น" },
  "ow.ota": { en: "OTA only", th: "OTA เท่านั้น" },
  "ow.av": { en: "Availability · next 14 days", th: "ห้องว่าง · 14 วันข้างหน้า" },
  "ow.lg1": { en: "Available", th: "ว่าง" },
  "ow.lg2": { en: "Booked", th: "จองแล้ว" },
  "ow.lg3": { en: "Blocked", th: "ปิดขาย" },
  "ow.mix": { en: "Channel mix · August", th: "สัดส่วนช่องทาง · สิงหาคม" },
  "ow.mixd": { en: "Direct 62%", th: "จองตรง 62%" },
  "ow.mixo": { en: "OTA 38%", th: "OTA 38%" },
  "ow.mixnote": {
    en: "Every point moved from OTA to direct keeps about ฿670 per booking in the house.",
    th: "ทุกการจองที่ย้ายจาก OTA มาเป็นจองตรง เก็บเงินไว้กับบ้านได้ราว 670 บาทต่อการจอง",
  },
  "ow.back": { en: "← Back to the guest site", th: "← กลับไปหน้าเว็บสำหรับแขก" },
  "col.code": { en: "Code", th: "รหัส" },
  "col.guest": { en: "Guest", th: "แขก" },
  "col.room": { en: "Room", th: "ห้อง" },
  "col.dates": { en: "Dates", th: "วันที่" },
  "col.src": { en: "Source", th: "ช่องทาง" },
  "col.amt": { en: "Amount", th: "ยอด" },
  "col.st": { en: "Status", th: "สถานะ" },
  "ow.searchph": { en: "Search guest or code…", th: "ค้นหาชื่อแขกหรือรหัส…" },
  "ow.dash": { en: "Dashboard", th: "แดชบอร์ด" },
  "ow.rooms": { en: "Rooms", th: "ห้องพัก" },
  "ow.cal": { en: "Calendar", th: "ปฏิทิน" },
  "ow.out": { en: "Sign out", th: "ออกจากระบบ" },
  "ow.new": { en: "New booking", th: "เพิ่มการจอง" },
  "ow.addRoom": { en: "Add room", th: "เพิ่มห้อง" },
  "ow.edit": { en: "Edit", th: "แก้ไข" },
  "ow.del": { en: "Delete", th: "ลบ" },
  "ow.save": { en: "Save", th: "บันทึก" },
  "ow.cancel": { en: "Cancel", th: "ยกเลิก" },
  "ow.checkin": { en: "Check in", th: "เช็คอิน" },
  "ow.checkout": { en: "Check out", th: "เช็คเอาท์" },
  "ow.cancelBk": { en: "Cancel booking", th: "ยกเลิกการจอง" },
  "ow.notes": { en: "Notes", th: "บันทึกเพิ่มเติม" },
  "ow.active": { en: "Active", th: "เปิดขาย" },
  "ow.reset": { en: "Reset demo data", th: "รีเซ็ตข้อมูลตัวอย่าง" },
  "ow.guestInfo": { en: "Guest info", th: "ข้อมูลแขก" },
  "ow.phone": { en: "Phone", th: "โทรศัพท์" },
  "ow.month": { en: "This month", th: "เดือนนี้" },
  "ow.sure": { en: "Are you sure?", th: "ยืนยันการลบ?" },
  "ow.login": { en: "Owner sign in", th: "เข้าสู่ระบบเจ้าของ" },
  "ow.email": { en: "Email", th: "อีเมล" },
  "ow.pin": { en: "PIN", th: "รหัส PIN" },
  "ow.pinHint": { en: "Demo PIN: 1234", th: "PIN ตัวอย่าง: 1234" },
  "ow.signin": { en: "Sign in", th: "เข้าสู่ระบบ" },
  "ow.next7": { en: "Next 7 days", th: "7 วันข้างหน้า" },
  "ow.st.in": { en: "In house", th: "เข้าพักอยู่" },
  "ow.st.ok": { en: "Confirmed", th: "ยืนยันแล้ว" },
  "ow.st.out": { en: "Checked out", th: "เช็คเอาท์แล้ว" },
  "ow.st.cancelled": { en: "Cancelled", th: "ยกเลิกแล้ว" },
  "ow.noMatch": { en: "No bookings match.", th: "ไม่พบรายการจอง" },
  "ow.allStatus": { en: "All statuses", th: "ทุกสถานะ" },
  "ow.passport": {
    en: "Passport / ID no.",
    th: "หมายเลขพาสปอร์ต/บัตรประชาชน",
  },
  "ow.nationality": { en: "Nationality", th: "สัญชาติ" },
  "ow.adults": { en: "Adults", th: "ผู้ใหญ่" },
  "ow.children": { en: "Children", th: "เด็ก" },
  "ow.arrival": { en: "Estimated arrival time", th: "เวลาถึงโดยประมาณ" },
  "ow.special": { en: "Special requests", th: "คำขอพิเศษ" },
  "ow.notRecorded": { en: "Not recorded", th: "ไม่ได้บันทึก" },
  "ow.stayGroup": { en: "Stay", th: "การเข้าพัก" },
  "ow.payGroup": { en: "Payment", th: "การชำระเงิน" },

  // v11 · rate calendar. New keys carry the EN copy in both slots until the
  // Thai pass lands · see docs/v11-th-keys.md.
  "ow.rateCalendar": { en: "Rate calendar", th: "ปฏิทินราคา" },
  "ow.rateLead": {
    en: "What each night costs · a date override beats a season, a season beats the base rate.",
    th: "ราคาของแต่ละคืน · ราคาเฉพาะวันมีผลเหนือช่วงฤดูกาล และช่วงฤดูกาลมีผลเหนือราคาพื้นฐาน",
  },
  "ow.ruleCount": { en: "{n} rate rules", th: "กฎราคา {n} ข้อ" },
  "ow.baseOnly": { en: "Base rate only", th: "ราคาพื้นฐานเท่านั้น" },
  "ow.rateBase": { en: "Base rate", th: "ราคาพื้นฐาน" },
  "ow.rateBaseInvalid": {
    en: "Enter a base rate above zero",
    th: "กรุณาใส่ราคาพื้นฐานมากกว่าศูนย์",
  },
  "ow.rateBaseSaved": { en: "Base rate saved", th: "บันทึกราคาพื้นฐานแล้ว" },
  "ow.rateFlat": { en: "Every night this month is {p}", th: "ทุกคืนในเดือนนี้ราคา {p}" },
  "ow.rateSpread": { en: "{lo} to {hi} this month", th: "{lo} ถึง {hi} ในเดือนนี้" },
  "ow.rateLegendBase": { en: "Base rate", th: "ราคาพื้นฐาน" },
  "ow.rateLegendSeason": { en: "Season", th: "ช่วงฤดูกาล" },
  "ow.rateLegendOverride": { en: "Date override", th: "ราคาเฉพาะวัน" },
  "ow.rateGridHint": {
    en: "Tap any date to start a one-day override for it.",
    th: "แตะวันที่ใดก็ได้ เพื่อตั้งราคาเฉพาะวันนั้น",
  },
  "ow.rateRules": { en: "Rules for this room", th: "กฎราคาของห้องนี้" },
  "ow.rateNoRules": {
    en: "No rules yet · every night is the base rate.",
    th: "ยังไม่มีกฎราคา · ทุกคืนใช้ราคาพื้นฐาน",
  },
  "ow.rateAdd": { en: "Add a rule", th: "เพิ่มกฎราคา" },
  "ow.rateKind": { en: "Rule type", th: "ประเภทกฎ" },
  "ow.rateSeason": { en: "Season", th: "ช่วงฤดูกาล" },
  "ow.rateOverride": { en: "Date override", th: "ราคาเฉพาะวัน" },
  "ow.rateUnnamed": { en: "Unnamed", th: "ไม่มีชื่อ" },
  "ow.rateLabel": { en: "Label", th: "ชื่อกฎ" },
  "ow.rateMode": { en: "Price mode", th: "รูปแบบราคา" },
  "ow.rateFixed": { en: "Fixed price", th: "ราคาคงที่" },
  "ow.rateMultiplier": { en: "Multiplier", th: "ตัวคูณ" },
  "ow.rateFixedLabel": { en: "Price per night (THB)", th: "ราคาต่อคืน (บาท)" },
  "ow.rateMultiplierLabel": {
    en: "Multiply the base rate by",
    th: "คูณราคาพื้นฐานด้วย",
  },
  "ow.rateAddBtn": { en: "Add rule", th: "เพิ่มกฎ" },
  "ow.rateSaved": { en: "Rule added", th: "เพิ่มกฎแล้ว" },
  "ow.rateSaveFailed": { en: "Could not save the rule", th: "บันทึกกฎไม่สำเร็จ" },
  "ow.rateDeleted": { en: "Rule deleted", th: "ลบกฎแล้ว" },
  "ow.rateDatesRequired": {
    en: "Start and end dates are required",
    th: "ต้องระบุวันเริ่มต้นและวันสิ้นสุด",
  },
  "ow.rateEndBeforeStart": {
    en: "End date must not be before the start date",
    th: "วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น",
  },
  "ow.rateAmountRequired": {
    en: "Enter a price or multiplier above zero",
    th: "กรุณาใส่ราคาหรือตัวคูณมากกว่าศูนย์",
  },

  "cond.title": { en: "Good to know", th: "ข้อมูลควรทราบ" },
  "sec.room": { en: "Room", th: "ห้องพัก" },
  "sec.bathroom": { en: "Bathroom", th: "ห้องน้ำ" },
  "sec.comfort": { en: "Comfort", th: "ความสบาย" },
  "sec.services": { en: "Services", th: "บริการ" },

  "off.page": { en: "Offers", th: "ข้อเสนอพิเศษ" },
  "off.eyebrow": { en: "Direct only", th: "จองตรงเท่านั้น" },
  "off.lead": {
    en: "Three ways the river rewards guests who book with the house.",
    th: "สามวิธีที่แม่น้ำตอบแทนแขกที่จองตรงกับบ้านหลังนี้",
  },
  "off.terms": {
    en: "Offers apply to direct bookings only.",
    th: "ข้อเสนอสำหรับการจองตรงเท่านั้น",
  },
  "off.cta": { en: "Book with this offer", th: "จองพร้อมข้อเสนอนี้" },
  "off.1.badge": { en: "Book 30 days ahead", th: "จองก่อน 30 วัน" },
  "off.1.title": { en: "Early bird · 15% off", th: "จองล่วงหน้า ลด 15%" },
  "off.1.body": {
    en: "Plan ahead and the river rewards you: 15% off the direct rate, same small deposit.",
    th: "วางแผนล่วงหน้า แม่น้ำมีรางวัลให้เสมอ ลด 15% จากราคาจองตรง มัดจำเท่าเดิม",
  },
  "off.2.badge": { en: "4 nights or more", th: "พัก 4 คืนขึ้นไป" },
  "off.2.title": { en: "Stay longer · 20% off", th: "พักยาว ลด 20%" },
  "off.2.body": {
    en: "Four nights or more and the riverside morning becomes your routine.",
    th: "พักตั้งแต่ 4 คืนขึ้นไป ให้เช้า ริมน้ำกลายเป็นกิจวัตรของคุณ",
  },
  "off.3.badge": { en: "3+ nights, booked direct", th: "จองตรง 3 คืนขึ้นไป" },
  "off.3.title": {
    en: "Direct perk · free airport pickup",
    th: "สิทธิ์จองตรง รับส่งสนามบินฟรี",
  },
  "off.3.body": {
    en: "Book direct for three nights or more and the sedan at gate 3 is on us.",
    th: "จองตรงตั้งแต่ 3 คืน เรารับคุณที่สนามบินฟรี รถรอที่ประตู 3",
  },
  "off.strip": { en: "Special offers", th: "ข้อเสนอพิเศษ" },
  "off.seeAll": { en: "See all offers", th: "ดูข้อเสนอทั้งหมด" },

  "gal.page": { en: "Gallery", th: "แกลเลอรี" },
  "gal.lead": {
    en: "Teak rooms, courtyard water, and the river that frames the house.",
    th: "ห้องไม้สัก น้ำในคอร์ทยาร์ด และแม่น้ำที่โอบบ้านหลังนี้",
  },
  "gal.all": { en: "All", th: "ทั้งหมด" },
  "gal.rooms": { en: "Rooms", th: "ห้องพัก" },
  "gal.pool": { en: "Pool", th: "สระน้ำ" },
  "gal.river": { en: "River", th: "แม่น้ำ" },
  "gal.food": { en: "Food", th: "อาหาร" },

  "ct.page": { en: "Contact", th: "ติดต่อเรา" },
  "ct.lead": {
    en: "Write to the house. We reply within a day, in Thai or English.",
    th: "เขียนถึงบ้านหลังนี้ เราตอบภายในหนึ่งวัน ทั้งไทยและอังกฤษ",
  },
  "ct.name": { en: "Name", th: "ชื่อ" },
  "ct.email": { en: "Email", th: "อีเมล" },
  "ct.message": { en: "Message", th: "ข้อความ" },
  "ct.send": { en: "Send message", th: "ส่งข้อความ" },
  "ct.success": {
    en: "Message sent. We reply within a day.",
    th: "ส่งข้อความแล้ว เราจะตอบกลับภายใน 1 วัน",
  },
  "ct.address": {
    en: "Charoenkrung 44, Bang Rak, Bangkok 10500",
    th: "เจริญกรุง 44 บางรัก กรุงเทพฯ 10500",
  },
  "ct.phone": { en: "+66 2 000 0000", th: "+66 2 000 0000" },
  "ct.mail": { en: "stay@teakhouse.demo", th: "stay@teakhouse.demo" },
  "ct.line": { en: "LINE @teakhouse", th: "LINE @teakhouse" },
  "ct.call": { en: "Call", th: "โทร" },
  "ct.lineBtn": { en: "LINE", th: "LINE" },
  "rooms.crumb": { en: "Rooms", th: "ห้องพัก" },
  "drp.hint": {
    en: "1st click: check-in · 2nd: check-out",
    th: "คลิกแรก: เช็คอิน · คลิกที่สอง: เช็คเอาท์",
  },
  "drp.nights": { en: "{n} nights", th: "{n} คืน" },
  "drp.done": { en: "Done", th: "เสร็จสิ้น" },

  "acc.signin": { en: "Sign in", th: "เข้าสู่ระบบ" },
  "acc.signup": { en: "Sign up", th: "สมัครสมาชิก" },
  "acc.google": { en: "Continue with Google", th: "ดำเนินการต่อด้วย Google" },
  "acc.line": { en: "Continue with LINE", th: "ดำเนินการต่อด้วย LINE" },
  "acc.orEmail": { en: "or with email", th: "หรือใช้อีเมล" },
  "acc.socialToast": {
    en: "Enabled per property on deployment",
    th: "เปิดใช้งานได้เมื่อทำระบบจริง",
  },
  "acc.name": { en: "Full name", th: "ชื่อ-นามสกุล" },
  "acc.email": { en: "Email", th: "อีเมล" },
  "acc.password": { en: "Password", th: "รหัสผ่าน" },
  "acc.create": { en: "Create account", th: "สร้างบัญชี" },
  "acc.haveAccount": { en: "Already have an account?", th: "มีบัญชีอยู่แล้ว?" },
  "acc.newHere": { en: "New here?", th: "เพิ่งมาครั้งแรก?" },
  "acc.welcome": { en: "Welcome back", th: "ยินดีต้อนรับกลับ" },
  "acc.myBookings": { en: "My bookings", th: "การจองของฉัน" },
  "acc.profile": { en: "Profile", th: "โปรไฟล์" },
  "acc.signout": { en: "Sign out", th: "ออกจากระบบ" },
  "acc.noBookings": { en: "No bookings yet", th: "ยังไม่มีการจอง" },
  "acc.bookFirst": { en: "Book your first stay", th: "จองการเข้าพักครั้งแรก" },
  "acc.cancelBooking": { en: "Cancel booking", th: "ยกเลิกการจอง" },
  "acc.cancelled": { en: "Cancelled", th: "ยกเลิกแล้ว" },
  "acc.freeCancel": {
    en: "Free cancellation until 3 days before arrival",
    th: "ยกเลิกฟรีก่อนเข้าพัก 3 วัน",
  },
  "acc.cancelConfirm": {
    en: "Cancel this booking? The nights will be released.",
    th: "ยกเลิกการจองนี้? คืนที่จองไว้จะถูกปล่อยให้ว่าง",
  },
  "acc.cancelYes": { en: "Yes, cancel", th: "ใช่ ยกเลิก" },
  "acc.cancelNo": { en: "Keep booking", th: "เก็บการจองไว้" },
  "acc.createForBooking": {
    en: "Create an account to manage this booking",
    th: "สร้างบัญชีเพื่อจัดการการจองนี้",
  },
  "acc.saveProfile": { en: "Save profile", th: "บันทึกโปรไฟล์" },
  "acc.saved": { en: "Saved", th: "บันทึกแล้ว" },
  "acc.errExists": {
    en: "An account with this email already exists.",
    th: "มีบัญชีที่ใช้ อีเมลนี้แล้ว",
  },
  "acc.errInvalid": {
    en: "Email or password incorrect",
    th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  },
  "acc.join": {
    en: "Join the house",
    th: "มาเป็นแขกของบ้านเรา",
  },
  "acc.errMissing": {
    en: "Please fill in all fields.",
    th: "กรุณากรอกข้อมูลให้ครบ",
  },
  "acc.statusOk": { en: "Confirmed", th: "ยืนยันแล้ว" },
  "acc.statusIn": { en: "Checked in", th: "เช็คอินแล้ว" },
  "acc.statusOut": { en: "Checked out", th: "เช็คเอาท์แล้ว" },
  "cur.chargedThb": {
    en: "Charged in Thai Baht",
    th: "ชำระเป็นเงินบาท",
  },
  "nav.megaAll": { en: "All rooms", th: "ห้องพักทั้งหมด" },
  "nav.megaCompare": { en: "Compare rooms", th: "เปรียบเทียบห้องพัก" },
  "nav.megaOffers": { en: "Special offers", th: "ข้อเสนอพิเศษ" },
  "nav.roomsCount": { en: "4 rooms", th: "4 ห้อง" },
  "off.bookOffer": {
    en: "Book with this offer →",
    th: "จองด้วยข้อเสนอนี้ →",
  },
  "hero.google": {
    en: "{n} · Google reviews",
    th: "{n} · รีวิว Google",
  },
  "hero.tonight": {
    en: "Tonight from {z}",
    th: "คืนนี้เริ่ม {z}",
  },
  // Thai pass · keys that existed only as literals in components until now.
  // Offer badges · two are numerals (locale-neutral), one is a word.
  "off.1.numeral": { en: "15%", th: "15%" },
  "off.2.numeral": { en: "20%", th: "20%" },
  "off.3.numeral": { en: "FREE", th: "ฟรี" },
  "rp.heroAlt": {
    en: "Teak hotel room interior",
    th: "ภายในห้องพักไม้สักของโรงแรม",
  },
  "trust.freeShort": {
    en: "Free cancellation",
    th: "ยกเลิกฟรี",
  },

  // v12 · owner dashboard metric info tips (Thai supplied by directive)
  "ow.tip.s1": {
    en: "Rooms occupied tonight out of all rooms.",
    th: "จำนวนห้องที่มีแขกเข้าพักคืนนี้ เทียบกับจำนวนห้องทั้งหมด",
  },
  "ow.tip.s2": {
    en: "Bookings checking in today.",
    th: "จำนวนการจองที่เช็คอินวันนี้",
  },
  "ow.tip.s3": {
    en: "Share of this month's bookings made directly with the hotel, not through an OTA.",
    th: "สัดส่วนการจองตรงกับโรงแรมในเดือนนี้ (ไม่ผ่าน OTA)",
  },
  "ow.tip.s4": {
    en: "Commission you did not pay to OTAs because these guests booked direct (estimated at 18%).",
    th: "ค่าคอมมิชชั่นที่ไม่ต้องจ่ายให้ OTA เพราะแขกจองตรง (ประมาณ 18%)",
  },
  "ow.tip.month": {
    en: "Room revenue this month, weighted by nights stayed.",
    th: "รายได้ค่าห้องเดือนนี้ คิดตามจำนวนคืนที่เข้าพัก",
  },
  "ow.tip.occ": {
    en: "Percentage of available room-nights booked this month.",
    th: "เปอร์เซ็นต์ของห้องพักที่ถูกจองในเดือนนี้ เทียบกับห้องว่างทั้งหมด",
  },
  "ow.tip.adr": {
    en: "Average Daily Rate · room revenue divided by room-nights sold.",
    th: "ราคาเฉลี่ยต่อห้องต่อคืนที่ขายได้ (รายได้ค่าห้อง ÷ จำนวนคืนที่ขาย)",
  },
  "ow.tip.bookings": {
    en: "Total bookings this month.",
    th: "จำนวนการจองทั้งหมดในเดือนนี้",
  },

  // v12 · availability range control · th mirrors en pending Thai pass, except
  // hNext which parameterizes the certified ow.next7 Thai ("7 วันข้างหน้า").
  "ow.avail.hNext": { en: "Next {n} days", th: "{n} วันข้างหน้า" },
  "ow.avail.prev": { en: "Previous month", th: "เดือนก่อนหน้า" },
  "ow.avail.next": { en: "Next month", th: "เดือนถัดไป" },
  "ow.avail.days": { en: "{n} days", th: "{n} วัน" },
  "ow.avail.today": { en: "Today", th: "วันนี้" },

  // v12 · guest nav additions · th mirrors en pending Thai pass
  "nav.dining": { en: "Dining", th: "ห้องอาหาร" },
  "nav.events": { en: "Events & Spaces", th: "อีเวนต์และพื้นที่จัดงาน" },
  /* v13 · the top-level nav item · short so six items never crowd at 1200-1366.
     The page title and the footer keep the full "Events & Spaces". */
  "nav.eventsShort": { en: "Events", th: "อีเวนต์" },

  // v12 · owner nav additions · th mirrors en pending Thai pass
  "ow.dining": { en: "Dining", th: "ห้องอาหาร" },
  "ow.events": { en: "Events", th: "อีเวนต์" },

  // v12 · dining page · th mirrors en pending Thai pass
  "dn.h1": { en: "The kitchen by the river", th: "ครัวริมแม่น้ำ" },
  "dn.lead": {
    en: "One long menu from morning rice soup to the last sundowner, cooked the way this stretch of the river eats.",
    th: "เมนูยาวหนึ่งเดียว ตั้งแต่ข้าวต้มยามเช้าไปจนถึงเครื่องดื่มยามอาทิตย์ตก ปรุงตามแบบที่ริมน้ำย่านนี้กินกัน",
  },
  "dn.story": {
    en: "The kitchen buys from the morning boat and the market behind the temple, so the specials are decided at the pier, not on paper.",
    th: "ครัวของเราซื้อวัตถุดิบจากเรือตอนเช้าและตลาดหลังวัด เมนูพิเศษจึงถูกตัดสินกันที่ท่าเรือ ไม่ใช่บนกระดาษ",
  },
  "dn.hours": {
    en: "Open daily · breakfast on the pier 07:00 to 11:00 · kitchen until 22:00",
    th: "เปิดทุกวัน · อาหารเช้าที่ท่าเรือ 07:00 ถึง 11:00 · ครัวเปิดถึง 22:00",
  },
  "dn.menuEyebrow": { en: "The menu", th: "เมนู" },
  "dn.menuH2": {
    en: "What the kitchen sends out",
    th: "จานเด็ดจากครัวของเรา",
  },

  // v12 · events & spaces page · th mirrors en pending Thai pass
  "ev.h1": { en: "The riverside pavilion", th: "ศาลาริมแม่น้ำ" },
  "ev.lead": {
    en: "An open-sided teak pavilion on the water for weddings, long dinners and parties · plus the house calendar of evenings worth planning around.",
    th: "ศาลาไม้สักเปิดโล่งริมน้ำ สำหรับงานแต่งงาน มื้อค่ำยาว ๆ และงานเลี้ยง · พร้อมปฏิทินค่ำคืนพิเศษของบ้านที่น่าวางแผนมาร่วม",
  },
  "ev.salonEyebrow": { en: "The function salon", th: "ห้องจัดเลี้ยง" },
  "ev.salonH2": {
    en: "One room, open to the river",
    th: "ห้องเดียว เปิดสู่แม่น้ำ",
  },
  "ev.salonP": {
    en: "The pavilion seats 60 for dinner and holds 90 standing, with the pier for arrivals by boat and the garden for drinks before.",
    th: "ศาลารองรับมื้อค่ำ 60 ที่นั่ง และงานเลี้ยงยืน 90 ท่าน มีท่าเรือสำหรับผู้มาถึงทางเรือ และสวนสำหรับเครื่องดื่มก่อนเริ่มงาน",
  },
  "ev.cap": { en: "60 seated · 90 standing", th: "นั่ง 60 · ยืน 90" },
  "ev.t1": { en: "Weddings", th: "งานแต่งงาน" },
  "ev.t2": { en: "Private dinners", th: "มื้อค่ำส่วนตัว" },
  "ev.t3": { en: "Parties", th: "งานเลี้ยง" },
  "ev.cta": { en: "Plan your event", th: "วางแผนงานของคุณ" },
  "ev.listEyebrow": { en: "Special events", th: "อีเวนต์พิเศษ" },
  "ev.listH2": { en: "On the house calendar", th: "ในปฏิทินของบ้าน" },
  "ev.empty": {
    en: "Nothing on the calendar right now · ask the desk what is coming.",
    th: "ตอนนี้ยังไม่มีงานในปฏิทิน · สอบถามงานที่กำลังจะมาถึงได้ที่แผนกต้อนรับ",
  },

  // v12 · homepage beyond-the-rooms strip · th mirrors en pending Thai pass
  "beyond.eyebrow": { en: "Beyond the rooms", th: "มากกว่าห้องพัก" },
  "beyond.h2": {
    en: "Dinner, evenings and the rest of the house",
    th: "มื้อค่ำ ค่ำคืนพิเศษ และส่วนอื่นของบ้าน",
  },
  "beyond.p": {
    en: "The pier kitchen, a riverside pavilion for occasions, and the seven things the house keeps ready.",
    th: "ครัวริมท่าเรือ ศาลาริมน้ำสำหรับโอกาสพิเศษ และสิ่งอำนวยความสะดวกที่บ้านเตรียมพร้อมไว้เสมอ",
  },
  "beyond.dining.p": {
    en: "Breakfast on the pier, a Thai kitchen and cocktails at sundown.",
    th: "อาหารเช้าที่ท่าเรือ ครัวไทย และค็อกเทลยามอาทิตย์ตก",
  },
  "beyond.events.p": {
    en: "A teak pavilion on the water for weddings, dinners and parties.",
    th: "ศาลาไม้สักริมน้ำ สำหรับงานแต่งงาน มื้อค่ำ และงานเลี้ยง",
  },
  "beyond.fac.p": {
    en: "Pool, garden, lounge and the quiet machinery of a good stay.",
    th: "สระว่ายน้ำ สวน เลานจ์ และทุกรายละเอียดเล็ก ๆ ของการพักผ่อนที่ดี",
  },

  // v13 · reserve a table · th mirrors en pending Thai pass
  "rsv.cta": { en: "Reserve a table", th: "จองโต๊ะ" },
  "rsv.stripLead": { en: "Ready to eat with us?", th: "พร้อมมาทานกับเราไหม" },
  "rsv.h1": { en: "A table by the river", th: "โต๊ะริมแม่น้ำ" },
  "rsv.lead": {
    en: "Tell us when and how many. No deposit, no card details · we hold the table and confirm by message.",
    th: "บอกเราว่ามาวันไหน กี่ท่าน · ไม่มีมัดจำ ไม่ต้องใช้บัตร เราจะจองโต๊ะไว้และยืนยันทางข้อความ",
  },
  "rsv.window": { en: "Service {w}", th: "ให้บริการ {w}" },
  "rsv.step1": { en: "When", th: "เมื่อไหร่" },
  "rsv.step2": { en: "How many", th: "กี่ท่าน" },
  "rsv.step3": { en: "Who to ask for", th: "ติดต่อใคร" },
  "rsv.date": { en: "Date", th: "วันที่" },
  "rsv.time": { en: "Time", th: "เวลา" },
  "rsv.party": { en: "Party size", th: "จำนวนท่าน" },
  "rsv.partyHint": {
    en: "For more than {n} guests, call the house and we will set the long table.",
    th: "มากกว่า {n} ท่าน โทรหาบ้านได้เลย เราจะจัดโต๊ะยาวให้",
  },
  "rsv.person": { en: "1 person", th: "1 ท่าน" },
  "rsv.people": { en: "{n} people", th: "{n} ท่าน" },
  "rsv.name": { en: "Name", th: "ชื่อ" },
  "rsv.contactKind": {
    en: "How should we reach you?",
    th: "ให้เราติดต่อกลับทางไหนดี",
  },
  "rsv.kindPhone": { en: "Phone", th: "โทรศัพท์" },
  "rsv.kindLine": { en: "LINE", th: "LINE" },
  "rsv.contact": { en: "Phone number or LINE id", th: "เบอร์โทรหรือ LINE ID" },
  "rsv.notes": { en: "Anything we should know", th: "มีอะไรให้เรารู้ไว้ไหม" },
  "rsv.notesHint": {
    en: "Allergies, a birthday, a table near the water",
    th: "อาหารที่แพ้ วันเกิด หรืออยากได้โต๊ะริมน้ำ",
  },
  "rsv.submit": { en: "Request the table", th: "ขอจองโต๊ะ" },
  "rsv.noDeposit": {
    en: "No deposit and no card details are taken.",
    th: "ไม่มีการเก็บมัดจำหรือข้อมูลบัตรใด ๆ",
  },
  "rsv.err.date": {
    en: "Please choose today or a later date.",
    th: "กรุณาเลือกวันนี้หรือวันถัดไป",
  },
  "rsv.err.time": {
    en: "That time is outside our service hours. Please pick one from the list.",
    th: "เวลานั้นอยู่นอกช่วงให้บริการ กรุณาเลือกจากรายการ",
  },
  "rsv.err.party": {
    en: "Please choose a party size from the list.",
    th: "กรุณาเลือกจำนวนท่านจากรายการ",
  },
  "rsv.err.name": { en: "Please tell us your name.", th: "กรุณาบอกชื่อของคุณ" },
  "rsv.err.contact": {
    en: "Please leave a phone number or LINE id so we can confirm.",
    th: "กรุณาใส่เบอร์โทรหรือ LINE ID เพื่อให้เรายืนยันได้",
  },
  "rsv.err.closed": {
    en: "Reservations are closed just now. Please contact the house directly.",
    th: "ขณะนี้ปิดรับจองชั่วคราว กรุณาติดต่อบ้านโดยตรง",
  },
  "rsv.err.failed": {
    en: "Something went wrong at our end. Please try again, or contact the house.",
    th: "มีบางอย่างผิดพลาดจากทางเรา กรุณาลองใหม่หรือติดต่อบ้านโดยตรง",
  },
  "rsv.okEyebrow": { en: "Reserved", th: "จองแล้ว" },
  "rsv.okH1": { en: "Your table is requested", th: "รับคำขอจองโต๊ะแล้ว" },
  "rsv.okLead": {
    en: "The kitchen has it. Keep this reference for when you arrive.",
    th: "ครัวรับทราบแล้วค่ะ เก็บรหัสนี้ไว้แจ้งตอนมาถึง",
  },
  "rsv.refLabel": { en: "Your reference", th: "รหัสการจองของคุณ" },
  "rsv.okNext": {
    en: "We will confirm by phone or LINE shortly. If your plans change, tell us and we will move the table.",
    th: "เราจะยืนยันทางโทรศัพท์หรือ LINE ในไม่ช้า หากแผนเปลี่ยน บอกเราได้เลย เราจะย้ายโต๊ะให้",
  },
  "rsv.backToMenu": { en: "Back to the menu", th: "กลับไปที่เมนู" },
  "rsv.closedH1": {
    en: "Reservations are closed just now",
    th: "ขณะนี้ปิดรับจองโต๊ะออนไลน์ชั่วคราว",
  },
  "rsv.closedP": {
    en: "The kitchen is not taking table bookings online at the moment. Call or message the house and we will find you a seat.",
    th: "ตอนนี้ครัวยังไม่เปิดรับจองโต๊ะออนไลน์ โทรหรือส่งข้อความหาบ้านได้เลย เราจะหาที่นั่งให้คุณ",
  },

  // v14 · desktop reservation card · th mirrors en pending Thai pass
  "rsv.cardEyebrow": { en: "The kitchen", th: "ครัวของเรา" },
  "rsv.cardH": { en: "Keep a table for you", th: "จองโต๊ะไว้ให้คุณ" },
  "rsv.cardP": {
    en: "Pick a time and we will have it laid when you arrive.",
    th: "เลือกเวลาที่สะดวก เราจะจัดโต๊ะไว้ให้พร้อมก่อนคุณมาถึง",
  },

  // v14 · event seat requests · th mirrors en pending Thai pass
  "evr.cta": { en: "Reserve seats", th: "จองที่นั่ง" },
  "evr.h1": { en: "Seats at the table", th: "ที่นั่งร่วมโต๊ะ" },
  "evr.lead": {
    en: "Tell us which evening and how many of you. No payment · the house confirms by phone or LINE.",
    th: "บอกเราว่าค่ำคืนไหน และมากันกี่ท่าน · ไม่มีการชำระเงิน ทางบ้านจะยืนยันทางโทรศัพท์หรือ LINE",
  },
  "evr.step1": { en: "Which evening", th: "ค่ำคืนไหน" },
  "evr.event": { en: "Event", th: "งาน" },
  "evr.guests": { en: "Guests", th: "จำนวนท่าน" },
  "evr.notesHint": {
    en: "Allergies, a celebration, anything we should plan for",
    th: "อาหารที่แพ้ โอกาสพิเศษ หรือสิ่งที่อยากให้เราเตรียมไว้",
  },
  "evr.submit": { en: "Request seats", th: "ขอจองที่นั่ง" },
  "evr.noPayment": {
    en: "No payment is taken. Seats are held once we confirm.",
    th: "ไม่มีการเก็บเงินล่วงหน้า ที่นั่งจะถูกกันไว้เมื่อเรายืนยันแล้ว",
  },
  "evr.okEyebrow": { en: "Requested", th: "ส่งคำขอแล้ว" },
  "evr.okH1": { en: "Your seats are requested", th: "รับคำขอจองที่นั่งแล้ว" },
  "evr.okLead": {
    en: "The house has it. Keep this reference for when you arrive.",
    th: "ทางบ้านรับทราบแล้ว เก็บรหัสนี้ไว้แจ้งตอนมาถึง",
  },
  "evr.okNext": {
    en: "We will confirm by phone or LINE shortly. Evenings with limited seating fill quickly, so we will tell you either way.",
    th: "เราจะยืนยันทางโทรศัพท์หรือ LINE ในไม่ช้า ค่ำคืนที่มีที่นั่งจำกัดมักเต็มเร็ว เราจะแจ้งให้ทราบทั้งกรณีที่ได้และไม่ได้",
  },
  "evr.backToEvents": { en: "Back to the events", th: "กลับไปที่หน้าอีเวนต์" },
  "evr.err.event": {
    en: "That evening is no longer open. Please choose another from the list.",
    th: "ค่ำคืนนั้นปิดรับแล้ว กรุณาเลือกงานอื่นจากรายการ",
  },
  "evr.err.name": { en: "Please tell us your name.", th: "กรุณาบอกชื่อของคุณ" },
  "evr.err.contact": {
    en: "Please leave a phone number or LINE id so we can confirm.",
    th: "กรุณาใส่เบอร์โทรหรือ LINE ID เพื่อให้เรายืนยันได้",
  },
  "evr.err.guests": {
    en: "Please choose how many seats you need.",
    th: "กรุณาเลือกจำนวนที่นั่งที่ต้องการ",
  },
  "evr.err.failed": {
    en: "Something went wrong at our end. Please try again, or contact the house.",
    th: "มีบางอย่างผิดพลาดจากทางเรา กรุณาลองใหม่หรือติดต่อบ้านโดยตรง",
  },

  // v14 · adaptive contact form · th mirrors en pending Thai pass
  "ct.about": { en: "What is this about?", th: "ต้องการติดต่อเรื่องอะไร" },
  "ct.aboutStay": { en: "A stay", th: "เรื่องการเข้าพัก" },
  "ct.aboutDining": { en: "Dining", th: "เรื่องห้องอาหาร" },
  "ct.aboutEvent": { en: "An event", th: "เรื่องการจัดงาน" },
  "ct.aboutOther": { en: "Something else", th: "เรื่องอื่น ๆ" },
  "ct.contactField": {
    en: "Email, phone or LINE id",
    th: "อีเมล เบอร์โทร หรือ LINE ID",
  },
  "ct.dates": { en: "Dates", th: "วันที่เข้าพัก" },
  "ct.checkIn": { en: "Check in", th: "วันเช็คอิน" },
  "ct.checkOut": { en: "Check out", th: "วันเช็คเอาท์" },
  "ct.when": { en: "When and how many", th: "วันและจำนวนท่าน" },
  "ct.party": { en: "Guests", th: "จำนวนท่าน" },
  "ct.sentH": { en: "Thank you · it is with us", th: "ขอบคุณ · เราได้รับข้อความแล้ว" },
  "ct.sentP": {
    en: "The house reads messages through the day and answers on the same channel you left.",
    th: "ทางบ้านอ่านข้อความตลอดวัน และจะตอบกลับทางช่องทางเดียวกับที่คุณฝากไว้",
  },
  "ct.sendAnother": { en: "Send another", th: "ส่งข้อความอีกครั้ง" },
  "ct.err.name": { en: "Please tell us your name.", th: "กรุณาบอกชื่อของคุณ" },
  "ct.err.contact": {
    en: "Please leave an email, phone number or LINE id so we can reply.",
    th: "กรุณาใส่อีเมล เบอร์โทร หรือ LINE ID เพื่อให้เราตอบกลับได้",
  },
  "ct.err.message": {
    en: "Please write a short message.",
    th: "กรุณาเขียนข้อความสั้น ๆ ถึงเรา",
  },
  "ct.err.failed": {
    en: "Something went wrong at our end. Please try again, or call the house.",
    th: "มีบางอย่างผิดพลาดจากทางเรา กรุณาลองใหม่หรือโทรหาบ้านโดยตรง",
  },

  // v14 · mobile drawer group · th mirrors en pending Thai pass
  "nav.exploreGroup": { en: "Experience", th: "ประสบการณ์" },

  // v14 · owner · th mirrors en pending Thai pass
  // Thai pass · owner panel labels that lived as literals in components.
  "ow.ownerEyebrow": { en: "Owner", th: "เจ้าของ" },
  "ow.settings": { en: "Settings", th: "ตั้งค่า" },
  "ow.revenue": { en: "Revenue", th: "รายได้" },
  "ow.revenueSub": {
    en: "Last 6 months · night-weighted booking totals",
    th: "6 เดือนล่าสุด · ยอดจองถ่วงน้ำหนักตามจำนวนคืน",
  },
  "ow.thisMonth": { en: "This month", th: "เดือนนี้" },
  "ow.occupancy": { en: "Occupancy", th: "อัตราเข้าพัก" },
  "ow.bookingsCount": { en: "Bookings", th: "จำนวนการจอง" },
  "ow.monthlyRevenue": { en: "Monthly revenue", th: "รายได้รายเดือน" },
  "ow.bySource": { en: "Bookings by source", th: "การจองแยกตามช่องทาง" },
  "ow.sourceNote": {
    en: "Placeholder mix for this month · wire OTA webhooks later",
    th: "สัดส่วนตัวอย่างของเดือนนี้ · เชื่อม webhook ของ OTA ภายหลัง",
  },
  "ow.exportCsv": { en: "Export CSV", th: "ส่งออก CSV" },
  "ow.addCategory": { en: "Add category", th: "เพิ่มหมวด" },
  "ow.addDish": { en: "Add dish", th: "เพิ่มเมนู" },
  "ow.addEvent": { en: "Add event", th: "เพิ่มงาน" },
  "ow.theMenu": { en: "The menu", th: "เมนูอาหาร" },
  "ow.tableRsv": { en: "Table reservations", th: "การจองโต๊ะ" },
  "ow.takingBookings": { en: "Taking bookings", th: "เปิดรับจอง" },
  "ow.switchedOff": { en: "Switched off", th: "ปิดรับจอง" },
  "ow.sittings": {
    en: "Guests can request a table on the dining page · {n} sittings per day.",
    th: "แขกขอจองโต๊ะได้จากหน้าห้องอาหาร · วันละ {n} รอบ",
  },
  "ow.rsvOffNote": {
    en: "The reserve-a-table button is hidden across the site while this is off.",
    th: "ปุ่มจองโต๊ะจะถูกซ่อนทั่วเว็บไซต์ตลอดช่วงที่ปิดอยู่",
  },
  "ow.serviceStarts": { en: "Service starts", th: "เริ่มให้บริการ" },
  "ow.kitchenCloses": { en: "Kitchen closes", th: "ครัวปิด" },
  "ow.largestParty": { en: "Largest party", th: "จำนวนแขกสูงสุดต่อโต๊ะ" },
  "ow.guestCount": { en: "{n} guests", th: "{n} ท่าน" },
  "ow.guestOne": { en: "1 guest", th: "1 ท่าน" },
  // Bare unit words · the reservation and seat-request rows print the number in
  // its own line and the unit beneath it, so these cannot reuse the "{n} ท่าน"
  // keys above. Thai does not inflect for number, so both forms are one word.
  "ow.unitGuest": { en: "guest", th: "ท่าน" },
  "ow.unitGuests": { en: "guests", th: "ท่าน" },
  "ow.unitSeat": { en: "seat", th: "ที่นั่ง" },
  "ow.unitSeats": { en: "seats", th: "ที่นั่ง" },
  "ow.lastSitting": {
    en: "The last sitting is one hour before the kitchen closes.",
    th: "รอบสุดท้ายคือหนึ่งชั่วโมงก่อนครัวปิด",
  },
  "ow.diningHero": { en: "Dining page hero", th: "ภาพหลักหน้าห้องอาหาร" },
  "ow.eventsHero": { en: "Events page hero", th: "ภาพหลักหน้าอีเวนต์" },
  "ow.diningHeroHint": {
    en: "Wide crop · replaces the food hero at the top of /dining.",
    th: "ครอปแนวนอน · ใช้แทนภาพอาหารด้านบนหน้า /dining",
  },
  "ow.eventsHeroHint": {
    en: "Wide crop · replaces the pavilion hero at the top of /events.",
    th: "ครอปแนวนอน · ใช้แทนภาพศาลาด้านบนหน้า /events",
  },
  "ow.upcomingTables": { en: "Upcoming tables", th: "โต๊ะที่จองไว้" },
  "ow.noTables": { en: "No tables booked yet.", th: "ยังไม่มีการจองโต๊ะ" },
  "ow.toConfirm": { en: "{n} to confirm", th: "รอยืนยัน {n} รายการ" },
  "ow.pastCount": { en: "Past ({n})", th: "ที่ผ่านมา ({n})" },
  "ow.hidePast": { en: "Hide past", th: "ซ่อนที่ผ่านมา" },
  "ow.seatRequests": { en: "Seat requests", th: "คำขอจองที่นั่ง" },
  "ow.noSeatRequests": { en: "No seat requests yet.", th: "ยังไม่มีคำขอจองที่นั่ง" },
  "ow.toAnswer": { en: "{n} to answer", th: "รอตอบ {n} รายการ" },
  "ow.seatsConfirmed": { en: "{n} seats confirmed", th: "ยืนยันแล้ว {n} ที่นั่ง" },
  "ow.filterAll": { en: "All", th: "ทั้งหมด" },
  "ow.nothingHere": { en: "Nothing here yet.", th: "ยังไม่มีข้อมูล" },
  "ow.newCount": { en: "{n} new", th: "ใหม่ {n} รายการ" },
  "ow.stNew": { en: "New", th: "ใหม่" },
  "ow.stRead": { en: "Read", th: "อ่านแล้ว" },
  "ow.stDone": { en: "Done", th: "จัดการแล้ว" },
  "ow.stPending": { en: "Pending", th: "รอดำเนินการ" },
  "ow.stConfirmed": { en: "Confirmed", th: "ยืนยันแล้ว" },
  "ow.stSeated": { en: "Seated", th: "นั่งแล้ว" },
  "ow.stCancelled": { en: "Cancelled", th: "ยกเลิกแล้ว" },
  "ow.stDeclined": { en: "Declined", th: "ปฏิเสธแล้ว" },
  "ow.calRooms": { en: "Rooms", th: "ห้องพัก" },
  "ow.calHeat": { en: "Heat", th: "ความหนาแน่น" },
  "ow.calHint": {
    en: "Tap available or blocked cells to toggle. Booked nights cannot be changed.",
    th: "แตะช่องว่างหรือช่องปิดขายเพื่อสลับสถานะ คืนที่มีการจองแล้วแก้ไขไม่ได้",
  },
  "ow.setLead": {
    en: "Hotel contact, stay policies, and booking confirmation email template.",
    th: "ข้อมูลติดต่อ นโยบายการเข้าพัก และเทมเพลตอีเมลยืนยันการจอง",
  },
  "ow.setHotelH": { en: "Hotel contact & policies", th: "ข้อมูลติดต่อและนโยบาย" },
  "ow.setHotelSub": {
    en: "Updates the Hotel record used by the property.",
    th: "อัปเดตข้อมูลโรงแรมที่ระบบใช้งาน",
  },
  "ow.setName": { en: "Name", th: "ชื่อโรงแรม" },
  "ow.setTagline": { en: "Tagline", th: "ประโยคแนะนำ" },
  "ow.setEmail": { en: "Email", th: "อีเมล" },
  "ow.setPhone": { en: "Phone", th: "เบอร์โทร" },
  "ow.setDeposit": { en: "Deposit %", th: "มัดจำ %" },
  "ow.setAddress": { en: "Address", th: "ที่อยู่" },
  "ow.setCity": { en: "City", th: "เมือง" },
  "ow.setCountry": { en: "Country", th: "ประเทศ" },
  "ow.setPostal": { en: "Postal code", th: "รหัสไปรษณีย์" },
  "ow.setCheckIn": { en: "Check-in time", th: "เวลาเช็คอิน" },
  "ow.setCheckOut": { en: "Check-out time", th: "เวลาเช็คเอาท์" },
  "ow.setCancel": { en: "Cancellation policy", th: "นโยบายการยกเลิก" },
  "ow.setPets": { en: "Pets policy", th: "นโยบายสัตว์เลี้ยง" },
  "ow.setSaveHotel": { en: "Save hotel", th: "บันทึกข้อมูลโรงแรม" },
  "ow.setSaving": { en: "Saving…", th: "กำลังบันทึก…" },
  "ow.setEmailH": { en: "Confirmation email", th: "อีเมลยืนยันการจอง" },
  "ow.setEmailSub": {
    en: "Subject and body for booking confirmation. Placeholders are replaced when a booking is created.",
    th: "หัวเรื่องและเนื้อหาอีเมลยืนยันการจอง ตัวแปรในวงเล็บจะถูกแทนค่าเมื่อมีการจองเข้ามา การส่งอีเมลยังเป็นตัวอย่างจนกระทั่งตั้งค่า EMAIL_PROVIDER",
  },
  "ow.setSubject": { en: "Subject", th: "หัวเรื่อง" },
  "ow.setBody": { en: "Body", th: "เนื้อหา" },
  "ow.setSaveTemplate": { en: "Save template", th: "บันทึกเทมเพลต" },
  "ow.uploadType": {
    en: "Use a jpg, png or webp image.",
    th: "กรุณาใช้ไฟล์ jpg png หรือ webp",
  },
  "ow.uploadBig": {
    en: "That image is over 8MB even after resizing.",
    th: "รูปนี้ใหม่เกิน 8MB แม้หลังย่อขนาดแล้ว",
  },
  "ow.uploadFailed": {
    en: "Upload failed. Please try again.",
    th: "อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง",
  },
  "ow.uploadRemove": { en: "Remove image", th: "ลบรูป" },
  "ow.uploadNote": {
    en: "Image uploads activate after storage setup.",
    th: "การอัปโหลดรูปจะใช้งานได้หลังตั้งค่าที่เก็บไฟล์",
  },
  "ow.uploadBtn": { en: "Upload image", th: "อัปโหลดรูป" },
  "ow.replaceBtn": { en: "Replace image", th: "เปลี่ยนรูป" },
  "ow.uploading": { en: "Uploading", th: "กำลังอัปโหลด" },
  "ow.msgTo": { en: "to", th: "ถึง" },
  "ow.messages": { en: "Messages", th: "ข้อความ" },
};


/** Overlay brand/contact/policy strings from hotel.config presets. */
DICT["brand.tag"] = hotelConfig.tagline;
DICT["brand.name"] = { en: hotelConfig.name, th: hotelConfig.name };
DICT["ft.copy"] = {
  en: `© ${hotelConfig.name} · demo by Mikaro Studio`,
  th: `© ${hotelConfig.name} · ตัวอย่างโดย Mikaro Studio`,
};
DICT["bk.cancel"] = hotelConfig.policies.cancel;
DICT["cg.name"] = hotelConfig.concierge.name;
DICT["ow.eyebrow"] = {
  en: `${hotelConfig.name} · owner view`,
  th: `${hotelConfig.name} · มุมมองเจ้าของ`,
};
DICT["ct.address"] = hotelConfig.contact.address;
DICT["ct.phone"] = {
  en: hotelConfig.contact.phone,
  th: hotelConfig.contact.phone,
};
DICT["ct.mail"] = {
  en: hotelConfig.contact.email,
  th: hotelConfig.contact.email,
};
DICT["ct.line"] = {
  en: `LINE ${hotelConfig.contact.line}`,
  th: `LINE ${hotelConfig.contact.line}`,
};


export type { DictEntry as _DictEntry };
