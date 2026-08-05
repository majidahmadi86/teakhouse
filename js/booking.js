/* THE TEAK HOUSE · direct booking flow (demo) */
(function () {
  "use strict";

  var ROOMS = {
    loft:   { name: "River Loft",     rate: 3900, ota: 4700, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80", meta: "42 m² · King bed · River balcony" },
    suite:  { name: "Teak Suite",     rate: 3200, ota: 3850, img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80", meta: "36 m² · King bed · Bathtub" },
    garden: { name: "Garden Room",    rate: 2400, ota: 2900, img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80", meta: "28 m² · Queen bed · Courtyard" },
    twin:   { name: "Courtyard Twin", rate: 2100, ota: 2550, img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80", meta: "26 m² · 2 single beds · Desk" }
  };

  var S = { step: 1, room: null, nights: 1, in: "", out: "", g: "2", pay: "promptpay" };

  function fmt(n) { return "฿" + n.toLocaleString("en-US"); }
  function lang() { return window.TKH_LANG ? window.TKH_LANG() : "en"; }
  function t(en, th) { return lang() === "th" ? th : en; }
  function iso(d) { return d.toISOString().slice(0, 10); }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("bk");
    if (!root) return;

    /* prefill from URL */
    var q = new URLSearchParams(location.search);
    var today = new Date(), tmr = new Date(Date.now() + 864e5), aft = new Date(Date.now() + 2 * 864e5);
    S.in = q.get("in") || iso(tmr);
    S.out = q.get("out") || iso(aft);
    S.g = q.get("g") || "2";
    if (q.get("room") && ROOMS[q.get("room")]) S.room = q.get("room");

    function nights() {
      var a = new Date(S.in), b = new Date(S.out);
      var n = Math.round((b - a) / 864e5);
      return n > 0 ? n : 1;
    }

    function stepsBar() {
      var labels = [t("Dates", "วันที่"), t("Room", "ห้อง"), t("Deposit", "มัดจำ"), t("Confirmed", "ยืนยันแล้ว")];
      return '<div class="steps">' + labels.map(function (l, i) {
        var c = i + 1 === S.step ? "on" : (i + 1 < S.step ? "done" : "");
        return '<span class="' + c + '">' + (i + 1) + " · " + l + "</span>";
      }).join("") + "</div>";
    }

    function render() {
      var h = stepsBar();

      if (S.step === 1) {
        h += '<div class="bk-card rv in"><h2 style="margin-bottom:22px">' + t("When are you coming?", "มาพักวันไหนดีคะ") + '</h2>' +
          '<div class="bk-grid">' +
          '<div class="field"><label>' + t("Check-in", "เช็คอิน") + '</label><input type="date" id="f-in" value="' + S.in + '" min="' + iso(today) + '"></div>' +
          '<div class="field"><label>' + t("Check-out", "เช็คเอาท์") + '</label><input type="date" id="f-out" value="' + S.out + '"></div>' +
          '<div class="field"><label>' + t("Guests", "ผู้เข้าพัก") + '</label><select id="f-g">' +
            [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (String(n) === S.g ? " selected" : "") + ">" + n + " " + t(n > 1 ? "guests" : "guest", "ท่าน") + "</option>"; }).join("") +
          '</select></div></div>' +
          '<p style="font-size:.82rem;color:#5A6B62;margin:16px 0 22px;font-weight:600">' + t("Free cancellation up to 3 days before arrival.", "ยกเลิกฟรีก่อนเข้าพัก 3 วัน") + "</p>" +
          '<button class="btn btn-reed" id="go2">' + t("See available rooms", "ดูห้องว่าง") + " →</button></div>";
      }

      if (S.step === 2) {
        h += '<div class="bk-card rv in"><h2 style="margin-bottom:6px">' + t("Choose your room", "เลือกห้องของคุณ") + "</h2>" +
          '<p style="font-size:.85rem;color:#5A6B62;font-weight:600;margin-bottom:20px">' +
          S.in + " → " + S.out + " · " + nights() + " " + t(nights() > 1 ? "nights" : "night", "คืน") + "</p>";
        Object.keys(ROOMS).forEach(function (k) {
          var r = ROOMS[k];
          h += '<div class="bk-room' + (S.room === k ? " sel" : "") + '" data-room="' + k + '">' +
            '<img src="' + r.img + '" alt="' + r.name + '" data-fb>' +
            '<div class="grow"><h3>' + r.name + '</h3><p class="meta">' + r.meta + "</p></div>" +
            '<div style="text-align:right"><div style="font-family:var(--disp);font-size:1.25rem">' + fmt(r.rate) + "</div>" +
            '<div style="font-size:.7rem;color:#5A6B62;font-weight:700"><s>' + fmt(r.ota) + "</s> " + t("on Agoda", "บน Agoda") + "</div></div></div>";
        });
        h += '<div style="display:flex;gap:12px;margin-top:18px"><button class="btn btn-ghost" id="back1">←</button>' +
          '<button class="btn btn-reed" id="go3"' + (S.room ? "" : " disabled style='opacity:.4;pointer-events:none'") + ">" + t("Continue to deposit", "ไปหน้ามัดจำ") + " →</button></div></div>";
      }

      if (S.step === 3) {
        var r = ROOMS[S.room], n = nights(), total = r.rate * n, dep = Math.round(total * 0.3), save = (r.ota - r.rate) * n;
        h += '<div class="bk-card rv in"><h2 style="margin-bottom:20px">' + t("Secure your room", "ยืนยันห้องของคุณ") + "</h2>" +
          '<div class="bk-grid">' +
          '<div class="field"><label>' + t("Full name", "ชื่อ-นามสกุล") + '</label><input type="text" id="f-name" placeholder="' + t("As on your passport or ID", "ตามพาสปอร์ตหรือบัตรประชาชน") + '"></div>' +
          '<div class="field"><label>' + t("Email or LINE", "อีเมลหรือ LINE") + '</label><input type="text" id="f-mail" placeholder="you@email.com"></div></div>' +
          '<div class="summary"><div class="row"><span>' + r.name + " · " + n + " " + t(n > 1 ? "nights" : "night", "คืน") + "</span><span>" + fmt(total) + "</span></div>" +
          '<div class="row"><span>' + t("You save vs Agoda", "ประหยัดกว่า Agoda") + '</span><span class="save">−' + fmt(save) + "</span></div>" +
          '<div class="row total"><span>' + t("Deposit today (30%)", "มัดจำวันนี้ (30%)") + "</span><span>" + fmt(dep) + "</span></div>" +
          '<div class="row" style="font-size:.8rem;color:#5A6B62"><span>' + t("Balance at check-in", "ส่วนที่เหลือชำระตอนเช็คอิน") + "</span><span>" + fmt(total - dep) + "</span></div></div>" +
          '<div class="pay-tabs"><button id="p-pp" class="' + (S.pay === "promptpay" ? "on" : "") + '">PromptPay</button>' +
          '<button id="p-cc" class="' + (S.pay === "card" ? "on" : "") + '">' + t("Card", "บัตรเครดิต") + "</button></div>";
        if (S.pay === "promptpay") {
          h += '<div class="qr"><svg width="150" height="150" viewBox="0 0 21 21" shape-rendering="crispEdges">' + qrMock() + "</svg>" +
            '<p style="font-size:.78rem;font-weight:700;margin-top:12px;color:#5A6B62">' + t("Scan with any Thai banking app", "สแกนด้วยแอปธนาคารใดก็ได้") + "</p></div>";
        } else {
          h += '<div class="bk-grid"><div class="field" style="grid-column:1/-1"><label>' + t("Card number", "หมายเลขบัตร") + '</label><input inputmode="numeric" placeholder="4242 4242 4242 4242"></div>' +
            '<div class="field"><label>' + t("Expiry", "หมดอายุ") + '</label><input placeholder="12/28"></div>' +
            '<div class="field"><label>CVC</label><input placeholder="123"></div></div>';
        }
        h += '<div style="display:flex;gap:12px;margin-top:22px"><button class="btn btn-ghost" id="back2">←</button>' +
          '<button class="btn btn-brass" id="go4">' + t("Pay deposit", "ชำระมัดจำ") + " " + fmt(dep) + "</button></div>" +
          '<p style="font-size:.72rem;color:#5A6B62;margin-top:14px;font-weight:600">' + t("Demo mode: no real payment is taken.", "โหมดตัวอย่าง: ไม่มีการชำระเงินจริง") + "</p></div>";
      }

      if (S.step === 4) {
        var r2 = ROOMS[S.room], n2 = nights(), code = "TKH-" + (1000 + Math.floor(Math.random() * 9000));
        h += '<div class="ticket rv in"><p class="eyebrow" style="color:var(--brass-2)">' + t("Booking confirmed", "ยืนยันการจองแล้ว") + '</p>' +
          '<div class="code">' + code + "</div>" +
          '<div class="grid">' +
          "<div><b>" + t("Room", "ห้อง") + "</b>" + r2.name + "</div>" +
          "<div><b>" + t("Guests", "ผู้เข้าพัก") + "</b>" + S.g + "</div>" +
          "<div><b>" + t("Check-in", "เช็คอิน") + "</b>" + S.in + " · 14:00</div>" +
          "<div><b>" + t("Check-out", "เช็คเอาท์") + "</b>" + S.out + " · 12:00</div>" +
          "<div><b>" + t("Deposit paid", "มัดจำแล้ว") + "</b>" + fmt(Math.round(r2.rate * n2 * 0.3)) + "</div>" +
          "<div><b>" + t("Balance at check-in", "ชำระตอนเช็คอิน") + "</b>" + fmt(r2.rate * n2 - Math.round(r2.rate * n2 * 0.3)) + "</div>" +
          "</div>" +
          '<p style="margin-top:24px;font-size:.9rem;opacity:.85">' +
          t("Confirmation sent by email and LINE. Tell the concierge your arrival time and the house will be ready.", "ส่งการยืนยันทางอีเมลและ LINE แล้วค่ะ บอกเวลาถึงกับคอนเซียร์จได้เลย บ้านจะพร้อมรอคุณ") + "</p></div>" +
          '<div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-ghost" href="/">' + t("Back to the house", "กลับหน้าแรก") + "</a></div>";
      }

      root.innerHTML = h;
      bind();
      root.querySelectorAll("img[data-fb]").forEach(function (img) {
        img.addEventListener("error", function () { img.classList.add("img-missing"); img.removeAttribute("src"); });
      });
    }

    function bind() {
      var e;
      if ((e = document.getElementById("go2"))) e.onclick = function () {
        S.in = document.getElementById("f-in").value || S.in;
        S.out = document.getElementById("f-out").value || S.out;
        S.g = document.getElementById("f-g").value;
        if (new Date(S.out) <= new Date(S.in)) S.out = iso(new Date(new Date(S.in).getTime() + 864e5));
        S.step = 2; render(); window.scrollTo({ top: 0, behavior: "smooth" });
      };
      document.querySelectorAll(".bk-room").forEach(function (el) {
        el.onclick = function () { S.room = el.getAttribute("data-room"); render(); };
      });
      if ((e = document.getElementById("back1"))) e.onclick = function () { S.step = 1; render(); };
      if ((e = document.getElementById("go3"))) e.onclick = function () { if (S.room) { S.step = 3; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } };
      if ((e = document.getElementById("p-pp"))) e.onclick = function () { S.pay = "promptpay"; render(); };
      if ((e = document.getElementById("p-cc"))) e.onclick = function () { S.pay = "card"; render(); };
      if ((e = document.getElementById("back2"))) e.onclick = function () { S.step = 2; render(); };
      if ((e = document.getElementById("go4"))) e.onclick = function () { S.step = 4; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    }

    /* deterministic QR-looking mock */
    function qrMock() {
      var cells = "", seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) {
        var finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        var on = finder ? ((x % 6 === 0 || y % 6 === 0 || (x % 6 > 1 && x % 6 < 5 && y % 6 > 1 && y % 6 < 5)) ? 1 : 0) : (rnd() > 0.52 ? 1 : 0);
        if (on) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#12211C"/>';
      }
      return cells;
    }

    /* re-render on language switch */
    document.addEventListener("tkh:lang", function () { render(); });

    if (S.room) S.step = 2;
    render();
  });
})();
