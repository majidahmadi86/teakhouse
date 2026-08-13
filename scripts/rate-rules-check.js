/**
 * Seasonal rate rules · do they reach the surfaces that quote money?
 *
 * The 50 seeded rules went missing once (an old deployment's reset deleted them
 * and wrote none back) and nothing failed loudly · every price simply fell back
 * to the room's base rate, which looks completely normal. That is the failure
 * this checks for: not "is there a rule table", but "does a guest see different
 * prices on different nights, and does the owner".
 *
 * The booking flow and the receipt are covered by v11-booking-concierge, which
 * drives a real stay across a season boundary and checks the summed total in
 * step 2, step 3, the receipt and the stored row. This adds the two calendar
 * surfaces and the shape of the rule data itself.
 *
 *   node scripts/rate-rules-check.js
 *   BASE=https://teakhouse.mikaro.studio node scripts/rate-rules-check.js
 */

const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

const pad2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (isoStr, n) => {
  const d = new Date(isoStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Mirror of lib/pricing · an override beats a season, otherwise base. */
function expectedNightly(base, dateIso, rules) {
  const covering = rules.filter((r) => r.startDate <= dateIso && dateIso <= r.endDate);
  const rule =
    covering.find((r) => r.kind === "override") || covering.find((r) => r.kind === "season");
  if (!rule) return Math.round(base);
  if (rule.price != null) return Math.round(rule.price);
  return Math.round(base * (rule.multiplier ?? 1));
}

async function main() {
  const data = await (await fetch(`${BASE}/api/data`)).json();
  const rooms = data.rooms || [];
  const rules = data.priceRules || [];

  // ── 1 · the data ─────────────────────────────────────────────────────────
  check("rate rules exist at all", rules.length > 0, `${rules.length} rules`);
  const perRoom = {};
  for (const r of rules) perRoom[r.roomId] = (perRoom[r.roomId] || 0) + 1;
  const roomsWithRules = Object.keys(perRoom).length;
  check(
    "every room has rules",
    roomsWithRules === rooms.length,
    `${roomsWithRules}/${rooms.length} rooms`
  );
  const kinds = [...new Set(rules.map((r) => r.kind))].sort();
  check(
    "both a season and a date override are present",
    kinds.includes("season") && kinds.includes("override"),
    kinds.join(", ")
  );
  const today = iso(new Date());
  const live = rules.filter((r) => r.endDate >= today);
  check(
    "rules are anchored ahead of today, not stranded in the past",
    live.length === rules.length,
    `${live.length}/${rules.length} still upcoming`
  );

  const room = rooms.find((r) => r.slug === "river-loft") || rooms[0];
  const roomRules = rules.filter((r) => r.roomId === room.id);
  const base = room.rate ?? room.priceNight;

  // The nearest upcoming rule, and a window that straddles its first day.
  const upcoming = roomRules
    .filter((r) => r.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const checkIn = addDays(upcoming.startDate, -1);
  const checkOut = addDays(upcoming.endDate, 1);
  const nightsIso = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) nightsIso.push(d);
  const expected = nightsIso.map((d) => expectedNightly(base, d, roomRules));
  const distinctExpected = [...new Set(expected)];
  check(
    "the test stay genuinely crosses a rate boundary",
    distinctExpected.length > 1,
    `${room.slug} ${checkIn}..${checkOut} nightly ${expected.join(", ")}`
  );

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    timezoneId: "Asia/Bangkok",
  });
  const page = await ctx.newPage();

  // ── 2 · owner rate calendar · different prices on different dates ────────
  await page.goto(`${BASE}/owner/rates`, { waitUntil: "load" });
  await page
    .waitForFunction(() => document.querySelectorAll("[title*='฿']").length > 10, {
      timeout: 30000,
    })
    .catch(() => {});
  const ownerCells = await page.$$eval("[title*='฿']", (els) =>
    els.map((e) => e.getAttribute("title"))
  );
  const ownerPrices = [
    ...new Set(
      ownerCells
        .map((t) => (t.match(/฿([\d,]+)/) || [])[1])
        .filter(Boolean)
        .map((s) => Number(s.replace(/,/g, "")))
    ),
  ];
  check(
    "owner rate calendar renders a price per date",
    ownerCells.length >= 28,
    `${ownerCells.length} dated cells`
  );
  check(
    "owner rate calendar shows MORE THAN ONE price across the month",
    ownerPrices.length > 1,
    `distinct prices: ${ownerPrices.sort((a, b) => a - b).join(", ")}`
  );
  // Spot-check one dated cell against the arithmetic.
  const sample = ownerCells
    .map((t) => {
      const m = t.match(/(\d{4}-\d{2}-\d{2}) · ฿([\d,]+)/);
      return m ? { date: m[1], price: Number(m[2].replace(/,/g, "")) } : null;
    })
    .filter(Boolean);
  const ruleDay = sample.find((s) => s.date >= upcoming.startDate && s.date <= upcoming.endDate);
  if (ruleDay) {
    // The owner grid is per-room; find which room's price this matches.
    const anyRoomMatches = rooms.some((r) => {
      const rr = rules.filter((x) => x.roomId === r.id);
      return expectedNightly(r.rate ?? r.priceNight, ruleDay.date, rr) === ruleDay.price;
    });
    check(
      "a dated owner cell inside a rule equals base x multiplier",
      anyRoomMatches,
      `${ruleDay.date} shows ฿${ruleDay.price}`
    );
  } else {
    check("a dated owner cell inside a rule equals base x multiplier", false, "no in-rule cell visible this month");
  }

  // ── 3 · guest calendar · per-night prices on the day cells ───────────────
  // No room param on purpose · with a room in the URL /book opens at step 2 and
  // the picker is not on the page. At step 1 the day price is the cheapest room
  // available that night, which still moves with the rules.
  await page.goto(`${BASE}/book?in=${checkIn}&out=${checkOut}`, { waitUntil: "load" });
  await page.waitForSelector("[data-date-trigger]", { timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.locator("[data-date-trigger]").first().click();
  await page
    .waitForFunction(() => document.querySelectorAll(".rdp .text-deal").length > 5, {
      timeout: 20000,
    })
    .catch(() => {});
  const dayPrices = await page.$$eval(".rdp .text-deal", (els) =>
    els.map((e) => (e.textContent || "").trim())
  );
  const parsed = [
    ...new Set(dayPrices.map((t) => Number(t.replace(/[^\d]/g, ""))).filter((n) => n > 0)),
  ];
  check(
    "guest calendar prints a price under the day numbers",
    dayPrices.length >= 10,
    `${dayPrices.length} priced days`
  );
  check(
    "guest calendar shows MORE THAN ONE nightly price",
    parsed.length > 1,
    `distinct: ${parsed.sort((a, b) => a - b).join(", ")}`
  );
  // Step 1 prices are the lowest across all rooms, so the allowed set spans
  // every room's base and every rule that room has.
  const possible = new Set();
  for (const r of rooms) {
    const rb = r.rate ?? r.priceNight;
    possible.add(Math.round(rb));
    for (const x of rules.filter((y) => y.roomId === r.id)) {
      possible.add(x.price != null ? Math.round(x.price) : Math.round(rb * (x.multiplier ?? 1)));
    }
  }
  check(
    "every guest calendar price is one the rules can produce",
    parsed.every((p) => possible.has(p)),
    `saw ${parsed.join(", ")}`
  );

  await ctx.close();
  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILURES:");
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
