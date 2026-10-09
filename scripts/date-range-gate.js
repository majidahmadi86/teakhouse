/**
 * Date range gate · Mike's two booking-bar bugs, held shut.
 *
 *   "the date I pick shows reversed (checkout before check-in)"
 *   "when I press Check rates I need to pick the date again"
 *
 * Part 1 (unit): lib/dateRange.ts pickDay(), the one rule every picker uses.
 *   Every sequence of clicks, from either field, yields arrival < departure;
 *   a day on or before the arrival restarts the range; a complete range
 *   restarts on the next click from the check-in field.
 *
 * Part 2 (browser, EN and TH, 1366x768 and 390x844, against a running build):
 *   on the home hero, open the calendar from Check-in, click a late day, then
 *   an EARLIER day (must restart, never reverse), then a later one; the
 *   labels read arrival then departure with the right nights; "Check rates"
 *   lands on /book with exactly those dates and guests applied, the room list
 *   showing, no date picking asked for, no ISO date and no "1 nights" on the
 *   page. Desktop also drives the calendar with the keyboard alone. A URL
 *   with check-out before check-in is shown repaired, never reversed.
 *
 *   BASE=http://localhost:3000 node scripts/date-range-gate.js
 */
const { register } = require("tsx/cjs/api");
register();
const { chromium } = require("playwright");
const { pickDay, isComplete, addDays, nightsOf } = require("../lib/dateRange.ts");

const BASE = process.env.BASE || "http://localhost:3000";
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  · " + detail : ""}`);
}

/* ── Part 1 · the rule ─────────────────────────────────────────────────── */
function unit() {
  const d = (n) => addDays("2026-11-01", n);
  let r = { from: null, to: null };
  r = pickDay(r, d(10));
  check("unit · first click sets the arrival only", r.from === d(10) && r.to === null);
  r = pickDay(r, d(6));
  check("unit · a day before the arrival restarts the range (never reversed)", r.from === d(6) && r.to === null);
  r = pickDay(r, d(6));
  check("unit · the same day again restarts, no zero-night stay", r.from === d(6) && r.to === null);
  r = pickDay(r, d(9));
  check("unit · a later day completes it, arrival before departure", r.from === d(6) && r.to === d(9) && isComplete(r));
  r = pickDay(r, d(3));
  check("unit · a click on a complete range from Check-in starts a new one", r.from === d(3) && r.to === null);
  r = pickDay({ from: d(3), to: d(5) }, d(8), "out");
  check("unit · from the Check-out field a later day moves the departure", r.from === d(3) && r.to === d(8));
  r = pickDay({ from: d(3), to: d(5) }, d(1), "out");
  check("unit · from Check-out an earlier day restarts", r.from === d(1) && r.to === null);
  r = pickDay({ from: d(0), to: null }, d(40));
  check("unit · a stay longer than 30 nights is never formed", !isComplete(r) || nightsOf(r.from, r.to) <= 30);

  // Exhaustive: every 3-click sequence over 12 days, from either field.
  let bad = 0;
  for (const f of ["in", "out"]) {
    for (let a = 0; a < 12; a++)
      for (let b = 0; b < 12; b++)
        for (let c = 0; c < 12; c++) {
          let s = { from: null, to: null };
          for (const x of [a, b, c]) {
            s = pickDay(s, d(x), f);
            if (s.to && !(s.from < s.to)) bad++;
          }
        }
  }
  check("unit · 3456 click sequences never store a reversed or empty range", bad === 0, `${bad} bad`);
}

/* ── Part 2 · the real page ────────────────────────────────────────────── */
function hotelToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

async function clickDay(page, iso) {
  for (let i = 0; i < 3; i++) {
    const btn = page.locator(`[data-calendar] button[data-day="${iso}"]`);
    if (await btn.count()) {
      await btn.first().click();
      return true;
    }
    await page.locator("[data-calendar] button[aria-label]").nth(1).click(); // next month
    await page.waitForTimeout(150);
  }
  return false;
}

async function flow(browser, lang, width, height) {
  const tag = `[${lang} ${width}]`;
  const mobile = width < 768;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-cal-ready"), null, { timeout: 15000 });

  const form = page.locator("#tkh-hero-actions form[data-stay-search]");
  await form.locator('[data-stay-field="in"]').click();
  const panel = page.locator(mobile ? "[data-stay-sheet]" : "[data-stay-popover]");
  await panel.waitFor({ state: "visible", timeout: 10000 });
  check(`${tag} the range calendar opens from Check-in`, true);

  const t = hotelToday();
  const late = addDays(t, 10);
  const early = addDays(t, 6);
  const out = addDays(t, 9);
  await clickDay(page, late);
  await clickDay(page, early);
  const summary = await panel.locator("[data-stay-summary]").innerText();
  const pickOut = lang === "th" ? "เลือกวันเช็คเอาท์" : "select your departure";
  check(`${tag} an earlier second click restarts instead of reversing`, summary.includes(pickOut), summary);
  await clickDay(page, out);
  if (mobile) {
    await panel.locator("button.btn-primary").click();
  }
  await panel.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

  const vals = await form.evaluate((f) => ({
    in: f.querySelector('input[name="in"]').value,
    out: f.querySelector('input[name="out"]').value,
    inLabel: f.querySelector('[data-stay-text="in"]').getAttribute("data-v"),
    outLabel: f.querySelector('[data-stay-text="out"]').getAttribute("data-v"),
    nights: f.querySelector("[data-stay-nights]")?.getAttribute("data-v") ?? "",
  }));
  check(`${tag} the form holds arrival then departure`, vals.in === early && vals.out === out, `${vals.in} → ${vals.out}`);
  check(`${tag} the labels read the same order`, !!vals.inLabel && !!vals.outLabel && vals.inLabel !== vals.outLabel, `${vals.inLabel} → ${vals.outLabel}`);
  check(`${tag} nights shown correctly`, /3/.test(vals.nights) && !/1 nights/.test(vals.nights), vals.nights);

  await form.locator('select[name="g"]').selectOption("3");
  await Promise.all([page.waitForURL(/\/book/, { timeout: 30000 }), form.locator('button[type="submit"]').click()]);
  await page.locator("[data-booking-dock]").waitFor({ state: "attached", timeout: 30000 });
  await page.waitForTimeout(800);
  const book = await page.evaluate(() => ({
    trigger: document.querySelector("[data-date-trigger]")?.innerText.replace(/\s+/g, " ").trim() ?? "",
    rooms: document.querySelectorAll('li[id^="room-"]').length,
    url: location.search,
    guests: document.querySelector("select[data-guests]")?.value,
    text: document.body.innerText,
  }));
  check(`${tag} /book opens with the chosen dates applied`, book.trigger.includes(vals.inLabel) && book.trigger.includes(vals.outLabel), book.trigger);
  check(`${tag} /book carries the guests`, book.guests === "3", book.guests);
  check(`${tag} /book shows the rooms at once (nothing to pick again)`, book.rooms >= 6, `${book.rooms} rooms`);
  check(`${tag} no ISO date and no "1 nights" on /book`, !/\b\d{4}-\d{2}-\d{2}\b/.test(book.text) && !/\b1 nights\b/.test(book.text));
  check(`${tag} no page errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}

async function keyboard(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-cal-ready"), null, { timeout: 15000 });
  await page.locator('#tkh-hero-actions input[name="in"]').focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-stay-popover]").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(200);
  const focusedDay = await page.evaluate(() => document.activeElement?.getAttribute("data-day"));
  check("[keyboard] Enter on Check-in opens the calendar with a day focused", !!focusedDay, focusedDay ?? "none");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.locator("[data-stay-popover]").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  const v = await page.evaluate(() => {
    const f = document.querySelector("#tkh-hero-actions form");
    return { in: f.querySelector('input[name="in"]').value, out: f.querySelector('input[name="out"]').value };
  });
  check("[keyboard] arrows and Enter pick a two-night stay", nightsOf(v.in, v.out) === 2 && v.in > focusedDay, `${v.in} → ${v.out}`);
  await ctx.close();
}

async function repaired(browser) {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const t = hotelToday();
  await page.goto(`${BASE}/book?in=${addDays(t, 12)}&out=${addDays(t, 8)}&g=2`, { waitUntil: "load" });
  const text = await page.locator("[data-date-shell]").innerText();
  const [a, b] = text.split("→").map((s) => s.trim());
  check("[no JS] a reversed URL is shown repaired, arrival first", !!a && !!b && a !== b, text.replace(/\s+/g, " "));
  await ctx.close();
}

(async () => {
  unit();
  const browser = await chromium.launch();
  try {
    for (const lang of ["en", "th"]) {
      for (const [w, h] of [[1366, 768], [390, 844]]) await flow(browser, lang, w, h);
    }
    await keyboard(browser);
    await repaired(browser);
  } finally {
    await browser.close();
  }
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
})();
