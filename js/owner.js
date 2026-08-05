/* THE TEAK HOUSE · owner dashboard (demo data) */
(function () {
  "use strict";

  var BOOKINGS = [
    { code: "TKH-4271", guest: "Claire Dubois",      room: "River Loft",     in: "08-05", out: "08-08", src: "Direct", amt: 11700, st: "in"  },
    { code: "TKH-4270", guest: "ปริม วัฒนกุล",        room: "Teak Suite",     in: "08-05", out: "08-07", src: "Direct", amt: 6400,  st: "in"  },
    { code: "TKH-4269", guest: "Daniel Meier",       room: "Garden Room",    in: "08-04", out: "08-09", src: "Direct", amt: 12000, st: "ok"  },
    { code: "AGD-88213", guest: "Yuki Tanaka",       room: "Courtyard Twin", in: "08-04", out: "08-06", src: "Agoda",  amt: 5100,  st: "ok"  },
    { code: "TKH-4268", guest: "Tom & Sarah Ellis",  room: "River Loft",     in: "08-09", out: "08-12", src: "Direct", amt: 11700, st: "ok"  },
    { code: "BKG-55102", guest: "Marco Rossi",       room: "Garden Room",    in: "08-10", out: "08-13", src: "Booking",amt: 8700,  st: "ok"  },
    { code: "TKH-4267", guest: "อานนท์ ศรีสุข",       room: "Teak Suite",     in: "08-11", out: "08-14", src: "Direct", amt: 9600,  st: "ok"  },
    { code: "TKH-4266", guest: "Emma Laurent",       room: "Courtyard Twin", in: "08-02", out: "08-05", src: "Direct", amt: 6300,  st: "out" },
    { code: "TKH-4265", guest: "James Whitfield",    room: "River Loft",     in: "07-30", out: "08-03", src: "Direct", amt: 15600, st: "out" },
    { code: "AGD-87954", guest: "Li Wei",            room: "Garden Room",    in: "07-29", out: "08-02", src: "Agoda",  amt: 11600, st: "out" }
  ];

  var ROOMS = ["River Loft", "Teak Suite", "Garden Room 1", "Garden Room 2", "Courtyard Twin"];

  function t(en, th) { return (window.TKH_LANG && window.TKH_LANG() === "th") ? th : en; }

  function stLabel(st) {
    return { in: t("In house", "เข้าพักอยู่"), ok: t("Confirmed", "ยืนยันแล้ว"), out: t("Checked out", "เช็คเอาท์แล้ว") }[st];
  }

  function renderTable(filter, search) {
    var tb = document.getElementById("own-rows");
    if (!tb) return;
    var rows = BOOKINGS.filter(function (b) {
      if (filter === "direct" && b.src !== "Direct") return false;
      if (filter === "ota" && b.src === "Direct") return false;
      if (search && (b.guest + b.code + b.room).toLowerCase().indexOf(search.toLowerCase()) < 0) return false;
      return true;
    });
    tb.innerHTML = rows.map(function (b) {
      var srcCls = b.src === "Direct" ? "direct" : "ota";
      return "<tr><td style='font-weight:800'>" + b.code + "</td><td>" + b.guest + "</td><td>" + b.room + "</td>" +
        "<td>" + b.in + " → " + b.out + "</td>" +
        "<td><span class='src " + srcCls + "'>" + b.src + "</span></td>" +
        "<td>฿" + b.amt.toLocaleString("en-US") + "</td>" +
        "<td><span class='st " + b.st + "'>" + stLabel(b.st) + "</span></td></tr>";
    }).join("") || "<tr><td colspan='7' style='opacity:.6;padding:26px'>" + t("No bookings match.", "ไม่พบรายการจอง") + "</td></tr>";
  }

  function renderGrid() {
    var g = document.getElementById("own-grid");
    if (!g) return;
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var h = "<div></div>";
    for (var d = 0; d < 14; d++) {
      var day = new Date(Date.now() + d * 864e5);
      h += "<div class='dh'>" + day.getDate() + "</div>";
    }
    ROOMS.forEach(function (r) {
      h += "<div class='rn'>" + r + "</div>";
      for (var d2 = 0; d2 < 14; d2++) {
        var v = rnd();
        var cls = v < 0.55 ? "bk" : (v < 0.62 ? "bl" : "");
        h += "<div class='d " + cls + "' title='" + r + "'></div>";
      }
    });
    g.innerHTML = h;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var filter = "all", search = "";
    var f = document.getElementById("own-filter"), s = document.getElementById("own-search");
    if (f) f.addEventListener("change", function () { filter = f.value; renderTable(filter, search); });
    if (s) s.addEventListener("input", function () { search = s.value; renderTable(filter, search); });
    renderTable(filter, search);
    renderGrid();
    document.addEventListener("tkh:lang", function () { renderTable(filter, search); });
  });
})();
