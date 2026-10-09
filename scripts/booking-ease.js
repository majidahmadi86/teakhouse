/**
 * Booking-ease gate (directive v17, A4): from the home page to a confirmed
 * demo booking in under 60 seconds with at most ONE scroll, at 1366x768 and
 * 390x844, in English and Thai, against a running build on the dev database.
 *
 * The guest's path, the way Mike walks it:
 *   home → Check rates (the hero's booking panel, its default dates)
 *        → Select a room → Continue (the dock) → name, email, phone
 *        → Pay deposit (the dock) → the confirmation
 *
 * A "scroll" is counted whenever the next control the guest needs is not
 * fully inside the viewport (Playwright would have to scroll to reach it).
 * Scrolls the page does by itself (a new step bringing its top into view)
 * are not the guest's. Rows written go through qa() and are purged after.
 *
 *   BASE=http://localhost:3000 node scripts/booking-ease.js
 */
const { chromium } = require("playwright");
const { qa, withQaCleanup, loadEnv } = require("./lib/qa");

loadEnv();
const BASE = process.env.BASE || "http://localhost:3000";
const LIMIT_MS = 60000;
const MAX_SCROLLS = 1;

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  · " + detail : ""}`);
}

async function run(browser, lang, width, height) {
  const tag = `[${lang} ${width}x${height}]`;
  const mobile = width < 768;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const posted = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/bookings") && r.request().method() === "POST") posted.push(r.status());
  });

  let scrolls = 0;
  const reached = [];
  async function act(label, locator, fn) {
    await locator.waitFor({ state: "visible", timeout: 30000 });
    // Let a scroll the page started by itself (a new step) settle first.
    await page.evaluate(
      () =>
        new Promise((res) => {
          let last = -1, still = 0;
          const tick = () => {
            if (window.scrollY === last) still++;
            else (still = 0), (last = window.scrollY);
            if (still >= 6) res(null);
            else requestAnimationFrame(tick);
          };
          tick();
        })
    );
    const inView = await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
    });
    if (!inView) scrolls++;
    reached.push(`${label}${inView ? "" : " (scroll)"}`);
    await fn(locator);
  }

  const stamp = Date.now().toString(36).toUpperCase();
  const name = qa(`Ease ${lang} ${width} ${stamp}`);
  const t0 = Date.now();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });

  await act("Check rates", page.locator('#tkh-hero-actions form[data-stay-search] button[type="submit"]'), async (l) => {
    await Promise.all([page.waitForURL(/\/book/, { timeout: 30000 }), l.click()]);
  });
  await act("Select", page.locator('li[id^="room-"] button[aria-pressed]').first(), (l) => l.click());
  await act("Continue", page.locator("[data-dock-action]"), (l) => l.click());
  await act("Name", page.locator('input[autocomplete="name"]'), (l) => l.fill(name));
  await act("Email", page.locator('input[type="email"]'), (l) => l.fill(`ease-${stamp.toLowerCase()}@example.test`));
  await act("Phone", page.locator('input[type="tel"]'), (l) => l.fill("+66 81 234 5678"));
  await act("Pay deposit", page.locator("[data-dock-action]"), (l) => l.click());
  await page.locator("#tkh-receipt").waitFor({ state: "visible", timeout: 30000 });
  const ms = Date.now() - t0;
  await page.waitForTimeout(1500);
  const receipt = await page.locator("#tkh-receipt").innerText();
  const code = (receipt.match(/[A-Z]{3}-\d+/) || [])[0] || "";

  check(`${tag} confirmed in under 60 s`, ms < LIMIT_MS, `${(ms / 1000).toFixed(1)} s`);
  check(`${tag} at most one scroll`, scrolls <= MAX_SCROLLS, `${scrolls} · ${reached.join(" → ")}`);
  check(`${tag} the booking is stored (POST 201) and confirmed`, posted.includes(201) && !!code, `${posted.join(",")} ${code}`);
  check(`${tag} no page errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const lang of ["en", "th"]) {
      for (const [w, h] of [[1366, 768], [390, 844]]) await run(browser, lang, w, h);
    }
  } finally {
    await browser.close();
  }
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

withQaCleanup(main);
