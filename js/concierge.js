/* THE TEAK HOUSE · 24/7 concierge widget (demo intelligence, EN/TH) */
(function () {
  "use strict";

  var T = {
    fab: { en: "Concierge · 24/7", th: "คอนเซียร์จ · 24 ชม." },
    name: { en: "Nam · The Teak House", th: "น้ำ · The Teak House" },
    online: { en: "Online · replies instantly", th: "ออนไลน์ · ตอบทันที" },
    ph: { en: "Ask anything, any hour…", th: "ถามได้ทุกเรื่อง ทุกเวลา…" },
    hello: {
      en: "Sawasdee kha, welcome to The Teak House. I answer every hour of the night, in English and Thai. How can I help? ",
      th: "สวัสดีค่ะ ยินดีต้อนรับสู่ The Teak House ค่ะ น้ำตอบทุกคำถามตลอด 24 ชั่วโมง ทั้งภาษาไทยและอังกฤษ ให้ช่วยอะไรดีคะ"
    },
    chips: {
      en: ["Tonight's rates", "Airport pickup", "Late check-in", "Book a room"],
      th: ["ราคาคืนนี้", "รถรับสนามบิน", "เช็คอินดึก", "จองห้องพัก"]
    },
    fallback: {
      en: "I want to get that exactly right for you, so I've passed it to the family. They reply within the hour on LINE (@teakhouse). Meanwhile, may I help with rates, rooms or getting here?",
      th: "เรื่องนี้น้ำขอส่งต่อให้เจ้าของบ้านตอบให้ชัวร์ที่สุดนะคะ ทีมจะตอบกลับใน 1 ชั่วโมงทาง LINE (@teakhouse) ค่ะ ระหว่างนี้ให้น้ำช่วยเรื่องราคา ห้องพัก หรือการเดินทางไหมคะ"
    }
  };

  var INTENTS = [
    { k: /rate|price|cost|how much|tonight|ราคา|เท่าไหร่|เท่าไร|กี่บาท|คืนนี้/i, r: {
      en: "Tonight, direct with us: Courtyard Twin ฿2,100 · Garden Room ฿2,400 · Teak Suite ฿3,200 · River Loft ฿3,900. The same rooms are ฿450 to ฿800 more on Agoda. Shall I check your dates? Tap Book a room.",
      th: "ราคาจองตรงคืนนี้ค่ะ: Courtyard Twin 2,100.- · Garden Room 2,400.- · Teak Suite 3,200.- · River Loft 3,900.- ห้องเดียวกันบน Agoda แพงกว่า 450 ถึง 800 บาทค่ะ ให้น้ำเช็ควันที่ให้ไหมคะ กดจองห้องพักได้เลยค่ะ"
    }},
    { k: /airport|pickup|transfer|taxi|suvarnabhumi|don ?m|สนามบิน|รถรับ|แท็กซี่|สุวรรณภูมิ|ดอนเมือง/i, r: {
      en: "We arrange a private sedan from Suvarnabhumi (฿1,200) or Don Mueang (฿1,000), any hour. The driver waits at gate 3 with your name on a teak sign. Just send your flight number after booking.",
      th: "ทางเราจัดรถส่วนตัวรับจากสุวรรณภูมิ (1,200.-) หรือดอนเมือง (1,000.-) ได้ทุกเวลาค่ะ คนขับรอที่ประตู 3 พร้อมป้ายชื่อของคุณ เพียงส่งเลขเที่ยวบินหลังจองห้องค่ะ"
    }},
    { k: /check[- ]?in|check[- ]?out|late|arriv|midnight|เช็คอิน|เช็คเอาท์|ดึก|เที่ยงคืน|กี่โมง/i, r: {
      en: "Check-in from 14:00, check-out by 12:00. Arriving late is never a problem: the house desk is staffed 24 hours, and I hold your room until you knock. Tell me your arrival time and it will be noted.",
      th: "เช็คอินตั้งแต่ 14:00 น. เช็คเอาท์ก่อน 12:00 น. ค่ะ มาดึกแค่ไหนก็ไม่มีปัญหา ฟรอนต์มีคนดูแลตลอด 24 ชั่วโมง และน้ำจะเก็บห้องไว้ให้จนกว่าคุณจะมาถึงค่ะ บอกเวลาถึงได้เลยนะคะ"
    }},
    { k: /book|reserve|available|vacan|จอง|ห้องว่าง|ว่างไหม/i, r: {
      en: "With pleasure. The booking page shows live availability and takes a small deposit by card or PromptPay, and your room is confirmed instantly. <a href='/book' style='color:#A8814C;font-weight:800'>Book direct here →</a>",
      th: "ยินดีค่ะ หน้าจองแสดงห้องว่างแบบเรียลไทม์ มัดจำผ่านบัตรหรือพร้อมเพย์ แล้วยืนยันห้องทันทีค่ะ <a href='/book' style='color:#A8814C;font-weight:800'>จองตรงที่นี่ →</a>"
    }},
    { k: /breakfast|food|dinner|restaurant|eat|อาหาร|ข้าวเช้า|อาหารเช้า|ร้านอาหาร|กิน/i, r: {
      en: "Breakfast is served on the pier from 07:00 to 11:00: Thai rice soup, fresh fruit, eggs any way, and coffee roasted in Chiang Rai. In the evening we grill river prawns on Fridays. Great neighborhood restaurants are 5 minutes on foot.",
      th: "อาหารเช้าเสิร์ฟริมท่าเรือ 07:00 ถึง 11:00 น. มีข้าวต้ม ผลไม้สด ไข่ตามสั่ง และกาแฟคั่วจากเชียงรายค่ะ เย็นวันศุกร์มีกุ้งแม่น้ำเผา และร้านอร่อยในย่านเดินแค่ 5 นาทีค่ะ"
    }},
    { k: /pool|swim|สระ|ว่ายน้ำ/i, r: {
      en: "The courtyard pool is open 07:00 to 21:00, saltwater, shaded by the old mango tree. Towels at the pool house, no reservation needed.",
      th: "สระน้ำเกลือกลางคอร์ทยาร์ดเปิด 07:00 ถึง 21:00 น. ใต้ร่มต้นมะม่วงเก่าแก่ค่ะ มีผ้าเช็ดตัวที่ศาลาริมสระ ไม่ต้องจองล่วงหน้าค่ะ"
    }},
    { k: /where|address|bts|train|boat|get there|map|location|ที่ไหน|เดินทาง|รถไฟฟ้า|เรือ|แผนที่/i, r: {
      en: "Charoenkrung 44, Bang Rak. BTS Saphan Taksin exit 2, then 6 minutes on foot along the river, or the Chao Phraya boat to Oriental Pier. <a href='/location' style='color:#A8814C;font-weight:800'>Directions →</a>",
      th: "เจริญกรุง 44 บางรักค่ะ BTS สะพานตากสิน ทางออก 2 เดินเลียบแม่น้ำ 6 นาที หรือเรือด่วนเจ้าพระยาลงท่าโอเรียนเต็ลค่ะ <a href='/location' style='color:#A8814C;font-weight:800'>ดูการเดินทาง →</a>"
    }},
    { k: /pet|dog|cat|สัตว์เลี้ยง|หมา|สุนัข|แมว/i, r: {
      en: "Small, well-mannered dogs are welcome in the two Garden Rooms (฿500/stay). The courtyard is theirs at dawn.",
      th: "น้องหมาตัวเล็กที่เรียบร้อยพักได้ที่ Garden Room ทั้ง 2 ห้องค่ะ (ค่าธรรมเนียม 500.- ต่อการเข้าพัก) ตอนเช้าตรู่คอร์ทยาร์ดเป็นของน้องเลยค่ะ"
    }},
    { k: /cancel|refund|policy|ยกเลิก|คืนเงิน|เงื่อนไข/i, r: {
      en: "Free cancellation up to 3 days before arrival, full deposit refunded. Inside 3 days the deposit converts to a credit for a future stay, valid one year.",
      th: "ยกเลิกฟรีก่อนเข้าพัก 3 วัน คืนมัดจำเต็มจำนวนค่ะ หากยกเลิกภายใน 3 วัน มัดจำจะเปลี่ยนเป็นเครดิตสำหรับการเข้าพักครั้งหน้า ใช้ได้ 1 ปีค่ะ"
    }},
    { k: /hello|hi|hey|สวัสดี|หวัดดี|ดีค|ดีครับ/i, r: {
      en: "Sawasdee kha. It is a quiet evening on the river. What may I help you with: rates, rooms, or getting here?",
      th: "สวัสดีค่ะ ค่ำคืนริมน้ำเงียบสงบดีค่ะ ให้น้ำช่วยเรื่องไหนดีคะ ราคา ห้องพัก หรือการเดินทางคะ"
    }}
  ];

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function now() { var d = new Date(); return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2); }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.hasAttribute("data-no-cg")) return;
    var lang = window.TKH_LANG ? window.TKH_LANG() : "en";

    var fab = el('<button class="cg-fab" aria-label="Open concierge chat"><span class="dot"></span><span class="cg-fab-t"></span></button>');
    var box = el(
      '<div class="cg" role="dialog" aria-label="Concierge chat">' +
        '<div class="cg-head"><div class="avatar">N</div><div class="t"><b class="cg-name"></b>' +
        '<span><i class="dot"></i><span class="cg-online"></span></span></div>' +
        '<button class="cg-x" aria-label="Close">✕</button></div>' +
        '<div class="cg-body"></div>' +
        '<div class="cg-chips"></div>' +
        '<div class="cg-in"><input type="text" aria-label="Message"><button aria-label="Send">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
        '</button></div></div>');
    document.body.appendChild(fab); document.body.appendChild(box);

    var body = box.querySelector(".cg-body"), chipsWrap = box.querySelector(".cg-chips"),
        input = box.querySelector("input"), send = box.querySelector(".cg-in button");

    function texts(l) {
      lang = l;
      fab.querySelector(".cg-fab-t").textContent = T.fab[l];
      box.querySelector(".cg-name").textContent = T.name[l];
      box.querySelector(".cg-online").textContent = T.online[l];
      input.setAttribute("placeholder", T.ph[l]);
      chipsWrap.innerHTML = "";
      T.chips[l].forEach(function (c) {
        var b = el("<button></button>"); b.textContent = c;
        b.addEventListener("click", function () { ask(c); });
        chipsWrap.appendChild(b);
      });
    }
    texts(lang);
    document.addEventListener("tkh:lang", function (e) { texts(e.detail); });

    function add(kind, html) {
      var m = el('<div class="msg ' + kind + '">' + html + '<span class="time">' + now() + "</span></div>");
      body.appendChild(m); body.scrollTop = body.scrollHeight; return m;
    }
    function typing() {
      var t = el('<div class="msg ai typing"><i></i><i></i><i></i></div>');
      body.appendChild(t); body.scrollTop = body.scrollHeight; return t;
    }
    function answer(q) {
      var hit = null;
      for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].k.test(q)) { hit = INTENTS[i].r; break; }
      var t = typing();
      setTimeout(function () {
        t.remove();
        add("ai", (hit || T.fallback)[lang] || (hit || T.fallback).en);
      }, 900 + Math.random() * 700);
    }
    function ask(q) {
      if (!q.trim()) return;
      add("me", q.replace(/</g, "&lt;"));
      input.value = "";
      answer(q);
    }

    var greeted = false;
    function open() {
      box.classList.add("open");
      if (!greeted) { greeted = true; setTimeout(function () { add("ai", T.hello[lang]); }, 350); }
      setTimeout(function () { input.focus(); }, 400);
    }
    fab.addEventListener("click", function () { box.classList.contains("open") ? box.classList.remove("open") : open(); });
    box.querySelector(".cg-x").addEventListener("click", function () { box.classList.remove("open"); });
    send.addEventListener("click", function () { ask(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") ask(input.value); });
  });
})();
