/**
 * v14 acceptance sweep.
 *
 * Standing bars on everything v14 touched, plus the new behaviour:
 *   · JS-disabled  · every new surface readable AND usable without scripting
 *                    (this is the bar that killed loading.tsx · see below)
 *   · pixel parity · shell text survives hydration at 1366 and 1093
 *   · Thai locale  · repeated with tkh-lang=th
 * v14-specific: the sticky reserve card and its GET handoff, dish thumbnails,
 * event seat requests end to end, the purpose-adaptive contact form (including
 * that it adapts with scripting OFF), the regrouped drawer fitting 390x844
 * without scroll, FAB/hero zero overlap at 360/390/414, cache-tag freshness
 * after an owner edit, and /book agreeing with itself across timezones.
 *
 *   node scripts/v14-acceptance.js
 *   BASE=https://... node scripts/v14-acceptance.js
 */

const { chromium } = require("playwright");
const { qa, withQaCleanup } = require("./lib/qa");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "qa-shots", "v14");
fs.mkdirSync(OUT, { recursive: true });

const PARITY_ROUTES = [
  "/",
  "/dining",
  "/dining/reserve",
  "/events",
  "/events/reserve",
  "/contact",
  "/rooms",
  "/book",
];
const WIDTHS = [
  { w: 1366, h: 900, tag: "1366" },
  { w: 1093, h: 800, tag: "1093" },
];

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

async function contextFor(
  browser,
  { js = true, lang = "en", width = 1280, height = 900, tz = "UTC" } = {}
) {
  const ctx = await browser.newContext({
    javaScriptEnabled: js,
    viewport: { width, height },
    deviceScaleFactor: 1,
    timezoneId: tz,
  });
  await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
  return ctx;
}

function normalize(t) {
  return t.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, "");
}
function lines(t) {
  return t.split("\n").map(normalize).filter((l) => l.length >= 12);
}
async function mainText(page) {
  return page.evaluate(() => {
    const el = document.querySelector("main") || document.body;
    return (el.innerText || "")
      .split("\n")
      .map((l) => l.replace(/[^\S\n]+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  });
}
async function fetchJson(url, init) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
}
async function submitForm(page, re = /[?&](ref|sent|error)=/) {
  await Promise.all([
    page.waitForURL(re, { timeout: 90000 }),
    page
      .locator("button[type='submit']")
      .click({ noWaitAfter: true, force: true, timeout: 15000 }),
  ]);
  await page.waitForLoadState("load");
}

async function run() {
  const browser = await chromium.launch();
  await fetchJson(`${BASE}/api/hotel`, {
    method: "PATCH",
    body: JSON.stringify({ reservationsEnabled: true }),
  });

  // ── 1 · JS-off readability + hydration parity ───────────────────────────
  //
  // This is the check that caught loading.tsx: a Suspense fallback streams the
  // skeleton and swaps in the real content with inline script, so with JS off
  // the content sits in a display:none wrapper forever. A page that "renders"
  // but shows only a skeleton passes a naive length check, so the shell text
  // is compared against the hydrated text as well.
  for (const lang of ["en", "th"]) {
    for (const { w, h, tag } of WIDTHS) {
      for (const route of PARITY_ROUTES) {
        const noJsCtx = await contextFor(browser, { js: false, lang, width: w, height: h });
        const noJs = await noJsCtx.newPage();
        await noJs.goto(BASE + route, { waitUntil: "load" });
        const shellText = await mainText(noJs);
        const hiddenHole = await noJs.evaluate(() =>
          Array.from(document.querySelectorAll("main div")).some((d) => {
            const s = getComputedStyle(d);
            return s.display === "none" && (d.textContent || "").length > 200;
          })
        );
        await noJsCtx.close();

        const jsCtx = await contextFor(browser, { js: true, lang, width: w, height: h });
        const withJs = await jsCtx.newPage();
        await withJs.goto(BASE + route, { waitUntil: "load" });
        await withJs.waitForTimeout(1200);
        const liveText = await mainText(withJs);
        await withJs.screenshot({
          path: path.join(OUT, `js-${lang}-${tag}-${route.replace(/\W+/g, "_")}.png`),
        });
        await jsCtx.close();

        check(
          `[${lang}/${tag}] ${route} readable with JS off`,
          shellText.length > 200,
          `${shellText.length} chars`
        );
        check(
          `[${lang}/${tag}] ${route} content is not stranded behind a Suspense swap`,
          !hiddenHole
        );
        const liveNorm = normalize(liveText);
        const chunks = lines(shellText);
        const missing = chunks.filter((c) => !liveNorm.includes(c));
        const lost = missing.length / Math.max(1, chunks.length);
        check(
          `[${lang}/${tag}] ${route} shell text survives hydration`,
          lost < 0.05,
          `${(lost * 100).toFixed(1)}% absent${missing.length ? " · " + missing.slice(0, 2).join(" | ") : ""}`
        );
      }
    }
  }

  // ── 2 · Desktop sticky reserve card ─────────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false, width: 1366, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });

    const card = page.locator("aside form[action='/dining/reserve']");
    check("dining shows the reserve card on desktop", (await card.count()) === 1);
    const sticky = await page
      .locator("aside")
      .first()
      .evaluate((el) => getComputedStyle(el).position);
    check("the reserve card is sticky", sticky === "sticky", sticky);

    // It must still be on screen deep into the menu.
    await page.evaluate(() => window.scrollTo(0, 2200));
    await page.waitForTimeout(300);
    const visible = await page.evaluate(() => {
      const el = document.querySelector("aside form[action='/dining/reserve']");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 1;
    });
    check("the reserve card follows the menu scroll", visible);
    await page.screenshot({ path: path.join(OUT, "reserve-card-scrolled.png") });

    // The card hands its values to the flow · plain GET, so it works JS-off.
    await page.selectOption("#card-party", "4");
    await Promise.all([
      page.waitForURL(/\/dining\/reserve\?/, { timeout: 30000 }),
      page.locator("aside button[type='submit']").click({ noWaitAfter: true, force: true }),
    ]);
    const partyValue = await page.locator("#rsv-party").inputValue();
    check(
      "the card prefills the reservation form",
      partyValue === "4",
      `party=${partyValue}`
    );
    await ctx.close();
  }

  // ── 3 · Mobile keeps the sticky bar, desktop does not double up ─────────
  {
    const ctx = await contextFor(browser, { js: false, width: 390, height: 844 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });
    const bar = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("div")).find(
        (d) =>
          getComputedStyle(d).position === "sticky" &&
          d.querySelector("a[href='/dining/reserve']")
      );
      return el ? getComputedStyle(el).display !== "none" : false;
    });
    check("mobile keeps the sticky reserve bar", bar);
    const cardOnMobile = await page
      .locator("aside")
      .first()
      .evaluate((el) => getComputedStyle(el).display)
      .catch(() => "none");
    check("the desktop card is hidden on mobile", cardOnMobile === "none", cardOnMobile);
    await ctx.close();
  }

  // ── 4 · Menu thumbnails ─────────────────────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });
    const thumbs = await page.locator("main ul li source[srcset*='/images/dishes/']").count();
    check("every seeded dish has a thumbnail", thumbs >= 18, `${thumbs} thumbnail sources`);
    const box = await page
      .locator("main ul li picture img")
      .first()
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
    check(
      "thumbnails are 56-72px square",
      box.w >= 56 && box.w <= 72 && box.h >= 56 && box.h <= 72,
      `${box.w}x${box.h}`
    );
    await ctx.close();
  }

  // ── 5 · Event seat request, end to end, WITH JS OFF ─────────────────────
  let evtRef = "";
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/events", { waitUntil: "load" });
    const ctas = await page.locator("main a[href^='/events/reserve']").count();
    check("each event card offers Reserve seats", ctas >= 3, `${ctas} CTAs`);

    await page.click("main a[href^='/events/reserve']");
    await page.waitForLoadState("load");
    await page.selectOption("#evr-guests", "3");
    await page.fill("#evr-name", qa("Seats NoJS"));
    await page.fill("#evr-contact", "+66 80 222 3333");
    await submitForm(page);

    const text = await mainText(page);
    const m = /EVT-[A-Z2-9]{4}/.exec(text);
    evtRef = m ? m[0] : "";
    check("JS-off seat request confirms with an EVT reference", Boolean(evtRef), evtRef);
    check(
      "no personal data in the confirmation URL",
      !/QA%20Seats|222.?3333/i.test(page.url()),
      page.url().slice(0, 100)
    );
    await page.screenshot({ path: path.join(OUT, "event-request-confirmed.png") });
    await ctx.close();
  }

  // ── 6 · Owner sees the request and can move its status ──────────────────
  {
    const list = await fetchJson(`${BASE}/api/event-requests`);
    const row = (list.body || []).find((r) => r.ref === evtRef);
    check("owner list contains the seat request", Boolean(row), evtRef);
    check(
      "the request carries its event and guest count",
      row && row.guests === 3 && row.status === "pending" && row.eventTitle,
      row ? `${row.guests} guests · ${row.status}` : "n/a"
    );
    if (row) {
      for (const status of ["confirmed", "declined"]) {
        const p = await fetchJson(`${BASE}/api/event-requests/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        check(`seat request moves to ${status}`, p.ok && p.body?.status === status);
      }
      const bad = await fetchJson(`${BASE}/api/event-requests/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "nonsense" }),
      });
      check("an invalid request status is rejected", bad.status === 400, `${bad.status}`);
    }
    const orphan = await fetchJson(`${BASE}/api/event-requests`, {
      method: "POST",
      body: JSON.stringify({
        eventId: "does-not-exist",
        name: qa("Seats"),
        contact: "+66 80 000 0000",
        guests: 2,
      }),
    });
    check(
      "a request against an unknown event is refused",
      orphan.status === 400 && orphan.body?.error === "event",
      `${orphan.status} ${orphan.body?.error ?? ""}`
    );
  }

  // ── 7 · Contact · adaptive with JS OFF, five fields max, stored tagged ──
  {
    for (const [about, expectShown, expectHidden] of [
      ["stay", ".ct-extra-stay", ".ct-extra-when"],
      ["dining", ".ct-extra-when", ".ct-extra-stay"],
      ["event", ".ct-extra-when", ".ct-extra-stay"],
      ["other", null, ".ct-extra-when"],
    ]) {
      const ctx = await contextFor(browser, { js: false });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/contact?about=${about}`, { waitUntil: "load" });

      if (expectShown) {
        const shown = await page
          .locator(expectShown)
          .evaluate((el) => getComputedStyle(el).display !== "none");
        check(`[${about}] the right extra field is shown with JS off`, shown);
      }
      const hidden = await page
        .locator(expectHidden)
        .evaluate((el) => getComputedStyle(el).display === "none");
      check(`[${about}] the other extra field stays hidden`, hidden);

      // Visible labelled fields · purpose, name, contact, message, plus at most
      // one extra group.
      const visibleFields = await page.evaluate(() => {
        const form = document.querySelector(".tkh-contact-form");
        const groups = new Set();
        form.querySelectorAll("input,textarea,select").forEach((el) => {
          if (el.type === "radio") {
            groups.add("purpose");
            return;
          }
          const wrap = el.closest(".ct-extra") || el.parentElement;
          if (getComputedStyle(el).display === "none") return;
          if (wrap && getComputedStyle(wrap).display === "none") return;
          groups.add(el.closest(".ct-extra") ? "extra" : el.name);
        });
        return [...groups];
      });
      check(
        `[${about}] at most five fields are visible`,
        visibleFields.length <= 5,
        visibleFields.join(", ")
      );
      await ctx.close();
    }

    // Submit with JS off · the message must land tagged by purpose.
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/contact?about=event`, { waitUntil: "load" });
    await page.fill("#ct-name", qa("Contact NoJS"));
    await page.fill("#ct-contact", "qa-nojs@example.com");
    await page.fill("#ct-message", "Asking about the pavilion for a birthday.");
    await submitForm(page);
    const sent = await mainText(page);
    check("JS-off contact submit confirms", /it is with us/i.test(sent), sent.slice(0, 60));
    check(
      "no personal data in the contact URL",
      !/QA%20Contact|qa-nojs/i.test(page.url()),
      page.url().slice(0, 90)
    );
    await ctx.close();

    const msgs = await fetchJson(`${BASE}/api/contact`);
    const mine = (msgs.body || []).find((m) => m.name === qa("Contact NoJS"));
    check(
      "the message is stored tagged with its purpose",
      mine && mine.purpose === "event",
      mine ? mine.purpose : "not found"
    );
    if (mine) {
      const p = await fetchJson(`${BASE}/api/contact/${mine.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });
      check("owner can mark a message done", p.ok && p.body?.status === "done");
      await fetchJson(`${BASE}/api/contact/${mine.id}`, { method: "DELETE" });
    }

    const short = await fetchJson(`${BASE}/api/contact`, {
      method: "POST",
      body: JSON.stringify({ purpose: "stay", name: "Q", contact: "x", message: "" }),
    });
    check("an empty contact submission is refused", short.status === 400, `${short.status}`);
  }

  // ── 8 · Drawer · every destination, no scroll at 390x844 ────────────────
  {
    const ctx = await contextFor(browser, { js: true, width: 390, height: 844 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/rooms", { waitUntil: "load" });
    await page.waitForTimeout(1300);
    await page.click("header button[aria-controls='mobile-nav-drawer']");
    await page.waitForTimeout(500);

    for (const href of [
      "/rooms",
      "/dining",
      "/events",
      "/location",
      "/contact",
      "/offers",
      "/experience",
      "/facilities",
      "/gallery",
    ]) {
      const n = await page.locator(`#mobile-nav-drawer a[href='${href}']`).count();
      check(`drawer reaches ${href}`, n >= 1, `${n}`);
    }

    const fit = await page.evaluate(() => {
      const nav = document.querySelector("#mobile-nav-drawer nav");
      return { over: nav.scrollHeight - nav.clientHeight };
    });
    check("the drawer fits 390x844 without scrolling", fit.over <= 0, `${fit.over}px overflow`);
    await page.screenshot({ path: path.join(OUT, "drawer-390.png") });
    await ctx.close();
  }

  // ── 9 · Home · FAB never covers the booking widget ──────────────────────
  for (const w of [360, 390, 414]) {
    const ctx = await contextFor(browser, { js: true, width: w, height: 800 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForTimeout(1800);

    const overlap = await page.evaluate(() => {
      const fab = document.querySelector("[data-concierge-fab]").getBoundingClientRect();
      const host = document.querySelector("#tkh-hero-actions");
      return Array.from(host.querySelectorAll("button,input,a")).filter((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width) return false;
        return (
          Math.min(fab.right, b.right) - Math.max(fab.left, b.left) > 0 &&
          Math.min(fab.bottom, b.bottom) - Math.max(fab.top, b.top) > 0
        );
      }).length;
    });
    check(`[${w}] FAB does not cover the hero booking widget`, overlap === 0, `${overlap} hits`);

    const compact = await page.evaluate(() =>
      document.querySelector("[data-concierge-fab]").hasAttribute("data-fab-compact")
    );
    check(`[${w}] FAB ships compact (the fail-safe state)`, compact);

    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(700);
    const expanded = await page.evaluate(() =>
      document.querySelector("[data-concierge-fab]").hasAttribute("data-fab-expanded")
    );
    check(`[${w}] FAB expands once the widget scrolls away`, expanded);
    await ctx.close();
  }

  // ── 10 · Owner edits still reach the guest page (cache tags) ────────────
  {
    const menu = await fetchJson(`${BASE}/api/dining`);
    const dish = (menu.body || []).flatMap((c) => c.items)[0];
    const original = dish.price;
    const probe = async () => {
      const html = await fetch(`${BASE}/dining`, { cache: "no-store" }).then((r) => r.text());
      return html.includes(`฿${(9999).toLocaleString("en-US")}`);
    };
    await fetchJson(`${BASE}/api/dining/items/${dish.id}`, {
      method: "PATCH",
      body: JSON.stringify({ price: 9999 }),
    });
    await new Promise((r) => setTimeout(r, 1200));
    check("an owner price edit appears on the guest page at once", await probe());
    await fetchJson(`${BASE}/api/dining/items/${dish.id}`, {
      method: "PATCH",
      body: JSON.stringify({ price: original }),
    });
    await new Promise((r) => setTimeout(r, 1200));
    check("and the revert appears too", !(await probe()));
  }

  // ── 11 · /book agrees with itself whatever the guest's timezone ─────────
  for (const tz of ["UTC", "Asia/Bangkok", "America/Los_Angeles"]) {
    const shellCtx = await contextFor(browser, { js: false, tz });
    const p1 = await shellCtx.newPage();
    await p1.goto(BASE + "/book", { waitUntil: "load" });
    const shell = await p1.evaluate(
      () =>
        document.querySelector("[data-date-shell]")?.innerText.replace(/\s+/g, " ").trim() ?? ""
    );
    await shellCtx.close();

    const liveCtx = await contextFor(browser, { js: true, tz });
    const p2 = await liveCtx.newPage();
    await p2.goto(BASE + "/book", { waitUntil: "load" });
    await p2.waitForTimeout(1600);
    const live = await p2.evaluate(
      () =>
        document.querySelector("[data-date-trigger]")?.innerText.replace(/\s+/g, " ").trim() ?? ""
    );
    await liveCtx.close();

    check(
      `[${tz}] the date box says the same thing before and after hydration`,
      shell === live && shell.length > 0,
      `"${shell}" vs "${live}"`
    );
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILURES:");
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

// Cleanup runs whether the suite passed, failed or threw · see lib/qa.js.
withQaCleanup(run);
