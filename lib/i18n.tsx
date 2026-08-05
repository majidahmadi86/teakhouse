"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "th";

export type DictEntry = { en: string; th: string };

export const DICT: Record<string, DictEntry> = {
  "nav.rooms": { en: "Rooms", th: "ห้องพัก" },
  "nav.experience": { en: "Experience", th: "ประสบการณ์" },
  "nav.location": { en: "Location", th: "การเดินทาง" },
  "nav.book": { en: "Book direct", th: "จองตรง" },
  "brand.tag": { en: "Riverside Boutique Hotel · Bangkok", th: "โรงแรมบูทีคริมแม่น้ำ · กรุงเทพฯ" },

  "hero.eyebrow": { en: "Charoenkrung · Chao Phraya riverside", th: "เจริญกรุง · ริมแม่น้ำเจ้าพระยา" },
  "hero.h1": { en: "The river keeps its own time.", th: "ริมน้ำ ที่เวลาเดินช้าลง" },
  "hero.lead": {
    en: "Twelve teak rooms above the Chao Phraya. Book direct with us and always pay less than on any booking site.",
    th: "ห้องพักไม้สัก 12 ห้อง ริมแม่น้ำเจ้าพระยา จองตรงกับเรา ราคาถูกกว่าเว็บจองทุกที่ เสมอ",
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
  "chip.save": { en: "Save ฿{z} per night", th: "ประหยัด {z} บาทต่อคืน" },
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
    th: "\"We asked about a late arrival at 1am and had an answer before the taxi moved. The room smelled of teak and the river was outside the window. We extended twice.\"",
  },
  "rev.1a": { en: "Claire · Lyon", th: "Claire · Lyon" },
  "rev.2": {
    en: "\"Booked direct in two minutes, paid the deposit with PromptPay, got the confirmation instantly. Cheaper than the price I had open on Agoda in the next tab.\"",
    th: "\"Booked direct in two minutes, paid the deposit with PromptPay, got the confirmation instantly. Cheaper than the price I had open on Agoda in the next tab.\"",
  },
  "rev.2a": { en: "ปริม · กรุงเทพฯ", th: "ปริม · กรุงเทพฯ" },
  "rev.3": {
    en: "\"Twelve rooms means the pier at breakfast is never crowded. The mango tree, the saltwater pool, the boats going by. It does not feel like a hotel. It feels like a house.\"",
    th: "\"Twelve rooms means the pier at breakfast is never crowded. The mango tree, the saltwater pool, the boats going by. It does not feel like a hotel. It feels like a house.\"",
  },
  "rev.3a": { en: "Daniel · Zürich", th: "Daniel · Zürich" },

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
  "bk.cardNum": { en: "Card number", th: "หมายเลขบัตร" },
  "bk.expiry": { en: "Expiry", th: "หมดอายุ" },

  "cg.fab": { en: "Concierge · 24/7", th: "คอนเซียร์จ · 24 ชม." },
  "cg.name": { en: "Nam · The Teak House", th: "น้ำ · The Teak House" },
  "cg.online": { en: "Online · replies instantly", th: "ออนไลน์ · ตอบทันที" },
  "cg.ph": { en: "Ask anything, any hour…", th: "ถามได้ทุกเรื่อง ทุกเวลา…" },

  "mobile.book": { en: "Book direct · from ฿2,100", th: "จองตรง · เริ่ม ฿2,100" },
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

  "cond.title": { en: "Good to know", th: "ข้อมูลควรทราบ" },
  "sec.room": { en: "Room", th: "ห้องพัก" },
  "sec.bathroom": { en: "Bathroom", th: "ห้องน้ำ" },
  "sec.comfort": { en: "Comfort", th: "ความสบาย" },
  "sec.services": { en: "Services", th: "บริการ" },
};

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tr: (entry: DictEntry) => string;
};

const Ctx = createContext<I18nCtx | null>(null);
const LANG_KEY = "tkh-lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(LANG_KEY);
      if (s === "th" || s === "en") setLangState(s);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
  }, [lang, ready]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const d = DICT[key];
      let s = d ? d[lang] : key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(`{${k}}`, String(v));
        });
      }
      return s;
    },
    [lang]
  );

  const tr = useCallback((entry: DictEntry) => entry[lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t, tr }), [lang, setLang, t, tr]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
