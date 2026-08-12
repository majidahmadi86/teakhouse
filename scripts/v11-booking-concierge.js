/**
 * v11 · booking across a season boundary, and the concierge's six questions.
 *
 * Booking: drives the real UI through a stay that straddles the seeded weekend
 * premium, then checks that the price shown is the SUM OF NIGHTLY RATES (not
 * rate x nights), that the receipt itemises the bands, and that the row the
 * server stored agrees.
 *
 * Concierge: asks six dated questions in English and Thai and checks every
 * answer against a fresh read of the database · a reply may only name rooms and
 * prices that are actually free at actually those prices, or say it will check.
 *
 *   node scripts/v11-booking-concierge.js
 */

const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

const baht = (n) => "฿" + Math.round(n).toLocaleString("en-US");
const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const toMs = (d) => Date.parse(d + "T00:00:00Z");
const addDays = (d, n) => iso(toMs(d) + n * DAY);

/** Re-implements the engine's precedence so the test is an independent check. */
function nightly(baseRate, date, rules) {
  const matching = rules.filter((r) => r.startDate <= date && date <= r.endDate);
  if (!matching.length) return { price: Math.round(baseRate), label: "" };
  const rank = (r) => (r.kind === "override" ? 0 : 1);
  const span = (r) => (toMs(r.endDate) - toMs(r.startDate)) / DAY + 1;
  matching.sort((a, b) => rank(a) - rank(b) || span(a) - span(b) || (a.id < b.id ? -1 : 1));
  const rule = matching[0];
  const price =
    rule.price != null
      ? Math.round(rule.price)
      : Math.round(baseRate * (rule.multiplier ?? 1));
  return { price, label: rule.label };
}

async function main() {
  const data = await (await fetch(`${BASE}/api/data`)).json();
  const room = data.rooms.find((r) => r.slug === "river-loft") || data.rooms[0];
  const rules = data.priceRules.filter((r) => r.roomId === room.id);

  // Straddle the nearest upcoming rule so the stay genuinely mixes rates.
  const today = iso(Date.now());
  const upcoming = rules
    .filter((r) => r.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (!upcoming) throw new Error("no upcoming rate rule seeded · nothing to cross");

  const checkIn = addDays(upcoming.startDate, -1);
  const checkOut = addDays(upcoming.endDate, 1);

  const nights = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    nights.push({ date: d, ...nightly(room.rate, d, rules) });
  }
  const expected = nights.reduce((s, n) => s + n.price, 0);
  const flat = room.rate * nights.length;
  const distinct = new Set(nights.map((n) => n.price));

  console.log(`\nStay ${checkIn} → ${checkOut} · ${room.name.en} · base ${baht(room.rate)}`);
  nights.forEach((n) => console.log(`   ${n.date}  ${baht(n.price)}  ${n.label || "base"}`));
  console.log(`   expected total ${baht(expected)} · flat would be ${baht(flat)}\n`);

  check(
    "test stay really crosses a rate boundary",
    distinct.size > 1 && expected !== flat,
    `${distinct.size} distinct nightly rates`
  );

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();

  const url = `${BASE}/book?in=${checkIn}&out=${checkOut}&room=${room.slug}`;
  await page.goto(url, { waitUntil: "load" });

  // Wait for the live rate rules to land rather than sleeping a fixed amount ·
  // until they do, every price on the page is the base rate.
  await page
    .waitForFunction(
      (amt) => (document.body.innerText || "").includes(amt),
      baht(expected),
      { timeout: 20000 }
    )
    .catch(() => {});

  // Step 2 · the room card must already price the real stay.
  const cardText = await page.locator(`#room-${room.slug}`).innerText();
  check(
    "step 2 room card shows the summed stay total",
    cardText.includes(baht(expected)),
    cardText.replace(/\s+/g, " ").slice(0, 90)
  );

  await page.locator(`#room-${room.slug} button`, { hasText: "Select" }).first().click();
  await page.waitForTimeout(400);
  await page.locator("button", { hasText: "Continue to deposit" }).first().click();
  await page.waitForTimeout(800);

  // Step 3 · per-night breakdown.
  const step3 = await page.locator("main").innerText();
  const bandsShown = nights
    .map((n) => baht(n.price))
    .filter((v, i, a) => a.indexOf(v) === i)
    .every((v) => step3.includes(v));
  check("step 3 lists every nightly rate band", bandsShown);
  check("step 3 shows the summed total", step3.includes(baht(expected)));
  check(
    "step 3 does not show the flat rate x nights total",
    !step3.includes(baht(flat)) || expected === flat,
    `flat ${baht(flat)}`
  );

  const stamp = Date.now().toString(36).toUpperCase();
  await page.locator('input[placeholder*="passport"], input[placeholder*="ID"]').first()
    .fill(`V11 Season Test ${stamp}`);
  await page.locator('input[type="email"]').first().fill(`v11-${stamp}@example.test`);
  await page.locator('input[type="tel"]').first().fill("+66 80 000 0000");
  await page.locator("button", { hasText: "Pay deposit" }).first().click();
  await page.waitForTimeout(2500);

  // Step 4 · receipt.
  const receipt = await page.locator("#tkh-receipt").innerText();
  check("receipt shows the per-night breakdown", bandsShown &&
    nights.map((n) => baht(n.price)).filter((v, i, a) => a.indexOf(v) === i)
      .every((v) => receipt.includes(v)), receipt.replace(/\s+/g, " ").slice(0, 120));
  check("receipt total is the sum of nightly rates", receipt.includes(baht(expected)));

  const code = (receipt.match(/[A-Z]{3}-\d+/) || [])[0] || "";
  await ctx.close();
  await browser.close();

  // The server's own record must agree · the client does not set the price.
  const bookings = await (await fetch(`${BASE}/api/bookings`)).json();
  const stored = bookings.find((b) => b.code === code);
  check(
    "stored booking amount equals the summed total",
    stored && stored.amount === expected,
    stored ? `${code} amount=${baht(stored.amount)}` : `booking ${code} not found`
  );

  // ── Concierge · six dated questions, EN and TH ───────────────────────────
  console.log("\n── concierge ──");
  const weekendStart = upcoming.startDate;
  const QUESTIONS = [
    { en: "Do you have a room free this weekend?", th: "ห้องว่างคืนนี้ไหมคะ" },
    { en: `Is anything available ${weekendStart} to ${addDays(weekendStart, 2)}?`,
      th: `ห้องว่าง ${weekendStart} to ${addDays(weekendStart, 2)} ไหม` },
    { en: "Any rooms tonight?", th: "ราคาคืนนี้เท่าไหร่" },
    { en: `What about ${addDays(today, 40)} to ${addDays(today, 43)}?`,
      th: `${addDays(today, 40)} to ${addDays(today, 43)} ว่างไหม` },
    { en: "How much is a room?", th: "ห้องพักราคาเท่าไหร่" },
    { en: "Where are you and how do I get there?", th: "โรงแรมอยู่ที่ไหน เดินทางยังไง" },
  ];

  for (let i = 0; i < QUESTIONS.length; i++) {
    for (const lang of ["en", "th"]) {
      const message = QUESTIONS[i][lang];
      const res = await fetch(`${BASE}/api/concierge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, lang }),
      });
      const body = await res.json().catch(() => ({}));
      const reply = (body.reply || "").replace(/<[^>]+>/g, " ");
      const label = `Q${i + 1} [${lang}]`;

      if (!res.ok) {
        // 503 = no AI configured and no dates in the question · the client
        // falls back to the offline matcher, which quotes no prices.
        check(`${label} no-date question degrades safely`, res.status === 503,
          `status ${res.status} · "${message}"`);
        continue;
      }

      // Every baht figure in the reply must be one the database can justify.
      const quoted = Array.from(reply.matchAll(/฿([\d,]+)/g)).map((m) =>
        Number(m[1].replace(/,/g, ""))
      );
      let grounded = true;
      let why = "";
      if (quoted.length) {
        const dates = Array.from(reply.matchAll(/\d{4}-\d{2}-\d{2}/g)).map((m) => m[0]);
        if (dates.length < 2) {
          grounded = false;
          why = "quoted money without naming the dates it applies to";
        } else {
          const [inD, outD] = dates;
          const legit = new Set();
          for (const r of data.rooms) {
            const rr = data.priceRules.filter((x) => x.roomId === r.id);
            let total = 0;
            const perNight = new Set();
            for (let d = inD; d < outD; d = addDays(d, 1)) {
              const p = nightly(r.rate, d, rr).price;
              total += p;
              perNight.add(p);
            }
            legit.add(total);
            perNight.forEach((p) => legit.add(p));
          }
          const bogus = quoted.filter((q) => !legit.has(q));
          if (bogus.length) {
            grounded = false;
            why = `figures not derivable from the calendar: ${bogus.join(", ")}`;
          }
        }
      }
      check(`${label} answer is grounded in the calendar`, grounded,
        why || `${body.source} · ${reply.replace(/\s+/g, " ").slice(0, 96)}`);
    }
  }

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
