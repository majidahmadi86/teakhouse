/* THE TEAK HOUSE · shared engine (i18n, reveals, nav, demo modal) */
(function () {
  "use strict";

  /* ---------------- i18n ---------------- */
  window.TKH_DICT = {
    // nav
    "nav.rooms": { en: "Rooms", th: "ห้องพัก" },
    "nav.experience": { en: "Experience", th: "ประสบการณ์" },
    "nav.location": { en: "Location", th: "การเดินทาง" },
    "nav.book": { en: "Book direct", th: "จองตรง" },
    "brand.tag": { en: "Riverside Boutique Hotel · Bangkok", th: "โรงแรมบูทีคริมแม่น้ำ · กรุงเทพฯ" },

    // hero
    "hero.eyebrow": { en: "Charoenkrung · Chao Phraya riverside", th: "เจริญกรุง · ริมแม่น้ำเจ้าพระยา" },
    "hero.h1": { en: "The river keeps its own time.", th: "ริมน้ำ ที่เวลาเดินช้าลง" },
    "hero.lead": { en: "Twelve teak rooms above the Chao Phraya. Book direct with us and always pay less than on any booking site.", th: "ห้องพักไม้สัก 12 ห้อง ริมแม่น้ำเจ้าพระยา จองตรงกับเรา ราคาถูกกว่าเว็บจองทุกที่ เสมอ" },
    "avail.in": { en: "Check-in", th: "เช็คอิน" },
    "avail.out": { en: "Check-out", th: "เช็คเอาท์" },
    "avail.guests": { en: "Guests", th: "ผู้เข้าพัก" },
    "avail.go": { en: "Check rates", th: "เช็คราคา" },
    "avail.note": { en: "Best rate guaranteed · direct bookings are always cheaper than Agoda and Booking.com", th: "การันตีราคาดีที่สุด · จองตรงถูกกว่า Agoda และ Booking.com เสมอ" },
    "g1": { en: "1 guest", th: "1 ท่าน" }, "g2": { en: "2 guests", th: "2 ท่าน" },
    "g3": { en: "3 guests", th: "3 ท่าน" }, "g4": { en: "4 guests", th: "4 ท่าน" },

    // index sections
    "about.eyebrow": { en: "A house, not a lobby", th: "บ้าน ไม่ใช่ล็อบบี้" },
    "about.h2": { en: "Golden teak, morning light, the sound of long-tail boats.", th: "ไม้สักทอง แสงยามเช้า และเสียงเรือหางยาว" },
    "about.p": { en: "A restored teak trading house from 1926, twelve rooms deep in the old riverside quarter. Breakfast on the pier, a small pool in the courtyard, and a team that remembers your name and your coffee.", th: "เรือนค้าไม้สักปี 2469 ที่ได้รับการบูรณะใหม่ 12 ห้องพักในย่านริมน้ำเก่าแก่ อาหารเช้าริมท่าเรือ สระว่ายน้ำเล็กๆ กลางคอร์ทยาร์ด และทีมงานที่จำชื่อคุณและกาแฟแก้วโปรดของคุณได้" },
    "about.cta": { en: "Our rooms", th: "ดูห้องพัก" },

    "rooms.eyebrow": { en: "Stay", th: "ห้องพัก" },
    "rooms.h2": { en: "Twelve rooms. No two alike.", th: "12 ห้อง ไม่มีห้องไหนเหมือนกัน" },
    "rooms.p": { en: "Every rate below is the direct price. The same room always costs more on Agoda or Booking.com, because they charge us commission and we would rather give that money back to you.", th: "ราคาด้านล่างคือราคาจองตรง ห้องเดียวกันบน Agoda หรือ Booking.com แพงกว่าเสมอ เพราะเว็บเหล่านั้นเก็บค่าคอมมิชชั่นจากเรา และเราเลือกคืนส่วนนั้นให้คุณแทน" },
    "rooms.all": { en: "See all rooms", th: "ดูห้องพักทั้งหมด" },
    "room.book": { en: "Book", th: "จอง" },
    "room.night": { en: "/ night", th: "/ คืน" },
    "chip.direct": { en: "Direct", th: "จองตรง" },
    "chip.via": { en: "on Agoda", th: "บน Agoda" },

    "sys.eyebrow": { en: "Always on", th: "พร้อมเสมอ" },
    "sys.h2": { en: "The house never sleeps, so you can.", th: "บ้านหลังนี้ไม่เคยหลับ เพื่อให้คุณหลับสบาย" },
    "sys.p": { en: "Questions get answered and rooms get booked at any hour, in Thai or English, even when the front desk light is off.", th: "ทุกคำถามมีคำตอบ ทุกห้องจองได้ตลอด 24 ชั่วโมง ทั้งภาษาไทยและอังกฤษ แม้ไฟที่ฟรอนต์จะปิดแล้ว" },
    "sys.f1h": { en: "24/7 concierge", th: "คอนเซียร์จ 24 ชม." },
    "sys.f1p": { en: "Ask about rates, airport pickup or late check-in at 2am and get an instant answer, in your language.", th: "ถามราคา รถรับสนามบิน หรือเช็คอินดึกตอนตี 2 ก็ได้คำตอบทันที ในภาษาของคุณ" },
    "sys.f2h": { en: "Book direct, pay less", th: "จองตรง จ่ายน้อยกว่า" },
    "sys.f2p": { en: "Real-time availability, secure deposit by card or PromptPay, instant confirmation. No agency in between.", th: "เช็คห้องว่างเรียลไทม์ มัดจำผ่านบัตรหรือพร้อมเพย์ ยืนยันทันที ไม่ผ่านตัวกลาง" },
    "sys.f3h": { en: "Guests, not bookings", th: "แขก ไม่ใช่แค่ยอดจอง" },
    "sys.f3p": { en: "Tell us your arrival time, allergies or a special occasion. The house is ready before you knock.", th: "บอกเวลาถึง อาหารที่แพ้ หรือโอกาสพิเศษของคุณ บ้านหลังนี้พร้อมก่อนคุณเคาะประตู" },

    "rev.eyebrow": { en: "Guest words", th: "เสียงจากแขก" },
    "rev.h2": { en: "They came for the river. They stayed for the house.", th: "มาเพราะแม่น้ำ แต่ประทับใจเพราะบ้าน" },

    "cta.h2": { en: "The river is waiting.", th: "แม่น้ำกำลังรอคุณอยู่" },
    "cta.p": { en: "Check tonight's rates in ten seconds. Direct is always the best price.", th: "เช็คราคาคืนนี้ใน 10 วินาที จองตรงคือราคาดีที่สุดเสมอ" },
    "cta.btn": { en: "Check rates", th: "เช็คราคา" },

    // footer
    "ft.about": { en: "A 1926 teak trading house on the Chao Phraya, restored into twelve rooms. Charoenkrung 44, Bang Rak, Bangkok.", th: "เรือนค้าไม้สักปี 2469 ริมแม่น้ำเจ้าพระยา บูรณะเป็นห้องพัก 12 ห้อง เจริญกรุง 44 บางรัก กรุงเทพฯ" },
    "ft.stay": { en: "Stay", th: "ที่พัก" },
    "ft.visit": { en: "Visit", th: "ข้อมูล" },
    "ft.talk": { en: "Talk to us", th: "ติดต่อเรา" },
    "ft.rooms": { en: "Rooms and rates", th: "ห้องพักและราคา" },
    "ft.book": { en: "Book direct", th: "จองตรง" },
    "ft.exp": { en: "Experience", th: "ประสบการณ์" },
    "ft.loc": { en: "Getting here", th: "การเดินทาง" },
    "ft.faq": { en: "Good to know", th: "ข้อมูลน่ารู้" },
    "ft.fine": { en: "Demo concept by Mikaro Studio · not a real hotel", th: "เว็บไซต์ตัวอย่างโดย Mikaro Studio · ไม่ใช่โรงแรมจริง" },

    // demo modal
    "dm.h3": { en: "You are inside a working system", th: "นี่คือระบบที่ทำงานได้จริง" },
    "dm.p": { en: "The Teak House is a live demo by Mikaro Studio. Everything on this site works right now:", th: "The Teak House คือเว็บตัวอย่างที่ใช้งานได้จริงโดย Mikaro Studio ทุกอย่างในเว็บนี้ทำงานจริง:" },
    "dm.l1": { en: "Direct booking with deposit · guests stop paying OTA prices", th: "ระบบจองตรงพร้อมมัดจำ · แขกไม่ต้องจ่ายราคา OTA" },
    "dm.l2": { en: "24/7 concierge answering in Thai and English", th: "คอนเซียร์จตอบอัตโนมัติ 24 ชม. ทั้งไทยและอังกฤษ" },
    "dm.l3": { en: "Owner dashboard with bookings, availability and commission saved", th: "แดชบอร์ดเจ้าของ ดูยอดจอง ห้องว่าง และค่าคอมมิชชั่นที่ประหยัดได้" },
    "dm.cta": { en: "Explore the demo", th: "ชมเว็บตัวอย่าง" },
    "dm.owner": { en: "Open the owner dashboard", th: "เปิดแดชบอร์ดเจ้าของ" }
  };

  var LANG_KEY = "tkh-lang";
  function getLang() { try { return localStorage.getItem(LANG_KEY) || "en"; } catch (e) { return "en"; } }
  function setLang(l) {
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    apply(l);
  }
  function apply(l) {
    document.documentElement.lang = l;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n"), d = window.TKH_DICT[k];
      if (d && d[l]) el.innerHTML = d[l];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph"), d = window.TKH_DICT[k];
      if (d && d[l]) el.setAttribute("placeholder", d[l]);
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === l);
    });
    document.dispatchEvent(new CustomEvent("tkh:lang", { detail: l }));
  }
  window.TKH_LANG = getLang;

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.TKH_EXTRA) { for (var k in window.TKH_EXTRA) window.TKH_DICT[k] = window.TKH_EXTRA[k]; }
    apply(getLang());
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });

    /* nav solid on scroll */
    var nav = document.querySelector(".nav");
    function onScroll() { if (nav) nav.classList.toggle("solid", window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* active link · cleanUrls-safe */
    var path = location.pathname.replace(/\/+$/, "").split("/").pop().replace(".html", "") || "index";
    document.querySelectorAll(".nav-links a, .drawer a").forEach(function (a) {
      var target = (a.getAttribute("href") || "").replace(/^\//, "").replace(".html", "") || "index";
      if (target === path) a.classList.add("active");
    });

    /* drawer */
    var drawer = document.querySelector(".drawer");
    var burger = document.querySelector(".burger");
    if (burger && drawer) {
      burger.addEventListener("click", function () { drawer.classList.add("open"); });
      drawer.querySelectorAll("a, .x").forEach(function (el) {
        el.addEventListener("click", function () { drawer.classList.remove("open"); });
      });
    }

    /* reveals + forceReveal net (covers .rv AND .curtain) */
    var revealables = document.querySelectorAll(".rv, .curtain");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealables.forEach(function (el) { io.observe(el); });
    }
    setTimeout(function () {
      revealables.forEach(function (el) { el.classList.add("in"); });
    }, 2500);

    /* count-up */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var end = parseInt(el.getAttribute("data-count"), 10) || 0;
      var pre = el.getAttribute("data-pre") || "";
      var run = function () {
        var t0 = null, dur = 1600;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + Math.round(end * eased).toLocaleString("en-US");
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      };
      if ("IntersectionObserver" in window) {
        var cio = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { run(); cio.unobserve(el); } });
        }, { threshold: 0.4 });
        cio.observe(el);
        setTimeout(function () { el.textContent = pre + end.toLocaleString("en-US"); }, 3000);
      } else { run(); }
    });

    /* demo modal · auto once per visitor, reopen via [data-dm-open] */
    var dm = document.querySelector(".dm");
    if (dm) {
      var close = function () { dm.classList.remove("open"); };
      dm.addEventListener("click", function (e) { if (e.target === dm) close(); });
      dm.querySelectorAll("[data-dm-close]").forEach(function (b) { b.addEventListener("click", close); });
      document.querySelectorAll("[data-dm-open]").forEach(function (b) {
        b.addEventListener("click", function () { dm.classList.add("open"); });
      });
      var seen = false;
      try { seen = localStorage.getItem("tkh-dm") === "1"; } catch (e) {}
      if (!seen && document.body.hasAttribute("data-dm-auto")) {
        setTimeout(function () {
          dm.classList.add("open");
          try { localStorage.setItem("tkh-dm", "1"); } catch (e) {}
        }, 9000);
      }
    }

    /* availability bar → book page with params */
    var av = document.querySelector("[data-avail]");
    if (av) {
      av.querySelector("button").addEventListener("click", function () {
        var i = av.querySelector("[name=in]").value, o = av.querySelector("[name=out]").value,
            g = av.querySelector("[name=g]").value;
        var q = new URLSearchParams(); if (i) q.set("in", i); if (o) q.set("out", o); q.set("g", g);
        location.href = "/book?" + q.toString();
      });
    }

    /* img fallback */
    document.querySelectorAll("img[data-fb]").forEach(function (img) {
      img.addEventListener("error", function () { img.classList.add("img-missing"); img.removeAttribute("src"); });
    });
  });
})();
