/**
 * Width sweep and JS-off readability · every guest route, EN and TH.
 *
 *   1 · with JavaScript, at every width from 320 to 1920 (including 1093 and
 *       1366): no horizontal overflow, no console error, no page error, no
 *       failed request from our own origin, and no raw dictionary key on
 *       screen
 *   2 · with JavaScript disabled, at 390 and 1366: the page is readable
 *       (<main> carries at least 80 characters and at least 80% of the text
 *       the hydrated page shows there) and nothing is stranded in
 *       a hidden wrapper (the loading.tsx failure mode: React streams a
 *       Suspense boundary's content into <div hidden id="S:n"> and swaps it
 *       in with a script, so with scripting off it stays hidden forever).
 *       Responsive twins hidden by a CSS breakpoint are not that, so only the
 *       hidden attribute and inline display:none count here
 *
 *   BASE=http://localhost:3031 node scripts/width-sweep.js
 *   ROUTES=/,/rooms LANGS=en node scripts/width-sweep.js     (a subset)
 */

const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";
const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1093, 1280, 1366, 1440, 1920];
const ROUTES = (
  process.env.ROUTES ||
  "/,/rooms,/rooms/teak-suite,/book,/dining,/dining/reserve,/events,/events/reserve,/experience,/facilities,/gallery,/offers,/location,/contact,/account,/account/signin,/account/signup"
).split(",");
const LANGS = (process.env.LANGS || "en,th").split(",");
const KEY_PREFIXES = /^(nav|hero|avail|drp|rooms?|bk|cg|a11y|ft|xp|gal|lc|off|ct|rsv|evr|ev|fac|dn|acc|mobile|db|do|dm|trust|house|sig|urg|sec|chip|cur|col|rp|beyond|rev|cta|brand)\./;

const results = [];
/** <main> text length with JavaScript, per lang/width/route (the JS-off yardstick). */
const hydrated = new Map();
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  if (!pass) console.log(`FAIL · ${name}${detail ? " · " + detail : ""}`);
}

/** A page load that survives one slow first response (an image optimiser
 *  warming up on a busy machine) without hiding a real failure. */
async function load(page, url) {
  try {
    return await page.goto(url, { waitUntil: "load", timeout: 60000 });
  } catch {
    return await page.goto(url, { waitUntil: "load", timeout: 90000 });
  }
}

async function run() {
  const browser = await chromium.launch();
  const origin = new URL(BASE).origin;

  for (const lang of LANGS) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({
        viewport: { width, height: width < 768 ? 844 : 900 },
        timezoneId: "Asia/Bangkok",
      });
      await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
      const page = await ctx.newPage();
      let errors = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 160));
      });
      page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 160)));
      page.on("response", (r) => {
        if (r.status() >= 400 && r.url().startsWith(origin)) errors.push(`HTTP ${r.status()} ${r.url().slice(origin.length, origin.length + 90)}`);
      });

      for (const route of ROUTES) {
        errors = [];
        let status = 0;
        try {
          const res = await load(page, BASE + route);
          status = res ? res.status() : 0;
          await page.waitForTimeout(700);
        } catch (e) {
          errors.push("goto: " + String(e).slice(0, 120));
        }
        const info = await page.evaluate((prefixes) => {
          const re = new RegExp(prefixes);
          const text = document.body.innerText || "";
          const keys = (text.match(/\b[a-z]{1,8}\.[a-zA-Z0-9]{1,16}(?:\.[a-zA-Z0-9]+)?\b/g) || []).filter((k) => re.test(k));
          const main = document.querySelector("main");
          const mainChars = (main ? main.innerText : "").replace(/\s+/g, " ").trim().length;
          return { over: document.documentElement.scrollWidth - window.innerWidth, keys: [...new Set(keys)].slice(0, 4), mainChars };
        }, KEY_PREFIXES.source).catch(() => ({ over: -1, keys: [], mainChars: 0 }));
        hydrated.set(`${lang}/${width}${route}`, info.mainChars);
        // The Google Maps embed on /location and /contact logs its own
        // third-party noise from inside its iframe; our own origin's errors
        // always count.
        const own = errors.filter((e) => !/maps\.googleapis|google\.com\/maps|gstatic/.test(e));
        const label = `[${lang}/${width}] ${route}`;
        check(`${label} loads`, status === 200, `${status}`);
        check(`${label} no horizontal overflow`, info.over >= 0 && info.over <= 1, `${info.over}px`);
        check(`${label} no console errors`, own.length === 0, own.slice(0, 3).join(" | "));
        check(`${label} no raw dictionary keys`, info.keys.length === 0, info.keys.join(", "));
      }
      await ctx.close();
    }
    console.log(`swept ${lang}`);
  }

  for (const lang of LANGS) {
    for (const width of [390, 1366]) {
      const ctx = await browser.newContext({
        viewport: { width, height: width < 768 ? 844 : 900 },
        javaScriptEnabled: false,
        timezoneId: "Asia/Bangkok",
      });
      await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
      const page = await ctx.newPage();
      for (const route of ROUTES) {
        await load(page, BASE + route);
        const info = await page.evaluate(() => {
          const main = document.querySelector("main");
          const text = (main ? main.innerText : "").replace(/\s+/g, " ").trim();
          const stranded = Array.from(
            document.querySelectorAll("body div[hidden], body div[style*='display:none'], body div[style*='display: none']")
          ).some((d) => (d.textContent || "").length > 200);
          return { chars: text.length, stranded };
        });
        const label = `[nojs ${lang}/${width}] ${route}`;
        // Readable · real text in <main>, and nearly all of what the hydrated
        // page shows there. A fixed floor failed pages that are short by
        // design (the gallery is pictures, sign-in is a form) and would pass
        // a long skeleton; the hydrated page is the honest yardstick.
        const live = hydrated.get(`${lang}/${width}${route}`) || 0;
        check(
          `${label} readable`,
          info.chars >= 80 && info.chars >= 0.8 * live,
          `${info.chars} chars without JS, ${live} with`
        );
        check(`${label} nothing stranded behind a hidden wrapper`, !info.stranded);
      }
      await ctx.close();
    }
  }

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed (${ROUTES.length} routes x ${WIDTHS.length} widths x ${LANGS.length} languages, plus JS-off readability)`);
  if (failed.length) process.exitCode = 1;
}

// This suite writes nothing, so it may end the process outright: a thrown
// navigation must not leave the browser holding the process open.
run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode || 0));
