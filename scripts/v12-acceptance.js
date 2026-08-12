/**
 * v12 acceptance sweep.
 *
 * Standing bars on everything v12 touched, plus the new widths:
 *   · JS-disabled  · /dining and /events readable and complete without JS
 *   · pixel parity · shell text survives hydration on every touched route,
 *                    now checked at 1366x900 and 1093x800 as well
 *   · Thai locale  · every run repeats with tkh-lang=th
 * v12-specific: header nav grouping (Experience dropdown at >=1200, drawer
 * items <1200), home Beyond-the-rooms strip, owner metric info tips, the
 * availability range control, owner dining/events CRUD persistence through
 * the API, unpublished rows never rendering, concierge dining/events intents.
 *
 *   node scripts/v12-acceptance.js
 *   BASE=https://... node scripts/v12-acceptance.js
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "qa-shots", "v12");
fs.mkdirSync(OUT, { recursive: true });

const PARITY_ROUTES = ["/", "/dining", "/events", "/facilities", "/book", "/rooms"];
const WIDTHS = [
  { w: 1366, h: 900, tag: "1366" },
  { w: 1093, h: 800, tag: "1093" },
];

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

async function contextFor(browser, { js = true, lang = "en", width = 1280, height = 900 } = {}) {
  const ctx = await browser.newContext({
    javaScriptEnabled: js,
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
  return ctx;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, "");
}

function lines(text) {
  return text
    .split("\n")
    .map((l) => normalize(l))
    .filter((l) => l.length >= 12);
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

async function run() {
  const browser = await chromium.launch();

  // ── 1 · JS-off readability + shell-survives-hydration, EN+TH, 1366+1093 ──
  for (const lang of ["en", "th"]) {
    for (const { w, h, tag } of WIDTHS) {
      for (const route of PARITY_ROUTES) {
        const noJsCtx = await contextFor(browser, { js: false, lang, width: w, height: h });
        const noJs = await noJsCtx.newPage();
        await noJs.goto(BASE + route, { waitUntil: "load" });
        const shellText = await mainText(noJs);
        await noJs.screenshot({
          path: path.join(OUT, `nojs-${lang}-${tag}-${route.replace(/\W+/g, "_")}.png`),
        });
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
        const liveNorm = normalize(liveText);
        const chunks = lines(shellText);
        const missing = chunks.filter((c) => !liveNorm.includes(c));
        const lost = missing.length / Math.max(1, chunks.length);
        check(
          `[${lang}/${tag}] ${route} shell text survives hydration`,
          lost < 0.05,
          `${(lost * 100).toFixed(1)}% absent${missing.length ? " · " + missing.slice(0, 3).join(" | ") : ""}`
        );
      }
    }
  }

  // ── 2 · Dining page content with JS off ──────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });
    const cats = await page.locator("main h3").count();
    const dishes = await page.locator("main ul li").count();
    check("dining lists 3 categories with JS off", cats === 3, `${cats} categories`);
    check("dining lists 18 dishes with JS off", dishes === 18, `${dishes} dishes`);
    const text = await mainText(page);
    check("dining hours chip present", /07:00/.test(text) && /22:00/.test(text));
    const prices = (text.match(/฿\d/g) || []).length;
    check("dish prices render", prices >= 18, `${prices} prices`);
    await ctx.close();
  }

  // ── 3 · Events page content with JS off ──────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/events", { waitUntil: "load" });
    const cards = await page.locator("main article").count();
    check("events lists 3 special events with JS off", cards === 3, `${cards} cards`);
    const text = await mainText(page);
    check("pavilion capacity present", /60/.test(text) && /90/.test(text));
    const planCta = await page.locator("main a[href='/contact']").count();
    const lineCta = await page.locator("main a[href*='line.me']").count();
    check("plan-your-event CTA goes to contact + LINE", planCta >= 1 && lineCta >= 1);
    const strip = await page.locator("main picture source[type='image/avif']").count();
    check("pavilion photo strip is local AVIF", strip >= 3, `${strip} avif sources`);
    await ctx.close();
  }

  // ── 4 · Home · Beyond the rooms strip ────────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    const dining = await page.locator("main a[href='/dining']").count();
    const events = await page.locator("main a[href='/events']").count();
    const fac = await page.locator("a[href='/facilities']").count();
    check("home strip links to /dining", dining >= 1, `${dining}`);
    check("home strip links to /events", events >= 1, `${events}`);
    check("home still links to /facilities 7+ times", fac >= 7, `${fac} links`);
    await ctx.close();
  }

  // ── 5 · Header · 1366 desktop band · nav grouping + dropdown ─────────────
  for (const js of [false, true]) {
    const ctx = await contextFor(browser, { js, width: 1366, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/rooms", { waitUntil: "load" });
    if (js) await page.waitForTimeout(1200);
    const tagJs = js ? "js" : "nojs";

    const nav = page.locator("header nav");
    for (const href of ["/rooms", "/dining", "/experience", "/location", "/contact"]) {
      const n = await nav.locator(`a[href='${href}']`).count();
      check(`[1366/${tagJs}] center nav has ${href}`, n >= 1, `${n}`);
    }
    const facTop = await nav.locator("a[href='/facilities']").count();
    check(`[1366/${tagJs}] facilities lives in the dropdown, not top level`, facTop === 0, `${facTop}`);
    const burger = await page
      .locator("header button[aria-controls='mobile-nav-drawer'], header button[aria-label*='menu' i]")
      .evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").length);
    check(`[1366/${tagJs}] hamburger hidden at 1366`, burger === 0, `${burger} visible`);
    await page.screenshot({ path: path.join(OUT, `header-1366-${tagJs}.png`) });

    if (js) {
      await page.hover("header nav a[href='/experience']");
      await page.waitForTimeout(400);
      for (const href of ["/experience", "/facilities", "/events", "/gallery"]) {
        const n = await page.locator(`[role='menu'] a[href='${href}']`).count();
        check(`[1366] experience dropdown has ${href}`, n >= 1, `${n}`);
      }
      await page.screenshot({ path: path.join(OUT, "header-1366-dropdown.png") });
    }
    await ctx.close();
  }

  // ── 6 · Header · 1093 hamburger band · drawer contents ───────────────────
  {
    const ctx = await contextFor(browser, { js: true, width: 1093, height: 800 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/rooms", { waitUntil: "load" });
    await page.waitForTimeout(1200);
    const centerNavVisible = await page.locator("header nav").evaluateAll(
      (els) => els.filter((e) => getComputedStyle(e).display !== "none").length
    );
    check("[1093] center nav hidden", centerNavVisible === 0, `${centerNavVisible} visible`);

    await page.click("header button[aria-controls='mobile-nav-drawer']");
    await page.waitForTimeout(500);
    for (const href of ["/rooms", "/offers", "/dining", "/experience", "/facilities", "/events", "/gallery", "/location", "/contact"]) {
      const n = await page.locator(`#mobile-nav-drawer a[href='${href}']`).count();
      check(`[1093] drawer has ${href}`, n >= 1, `${n}`);
    }
    await page.screenshot({ path: path.join(OUT, "drawer-1093.png") });
    await ctx.close();
  }

  // ── 7 · Owner dashboard · info tips + availability range ─────────────────
  {
    const ctx = await contextFor(browser, { js: true, width: 1366, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/owner", { waitUntil: "load" });
    await page.waitForTimeout(2500);

    const tips = page.locator("button[aria-label][aria-expanded]").filter({
      has: page.locator("svg circle"),
    });
    await tips.first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
    const tipCount = await tips.count();
    check("dashboard shows 8 metric info tips", tipCount === 8, `${tipCount} tips`);

    if (tipCount > 0) {
      const first = tips.first();
      await first.click();
      await page.waitForTimeout(200);
      const tooltip = page.locator("[role='tooltip']");
      const openCount = await tooltip.count();
      const tipText = openCount ? await tooltip.first().innerText() : "";
      check(
        "info tip opens on tap with the directive text",
        openCount === 1 && tipText.includes("Rooms occupied tonight"),
        tipText.slice(0, 60)
      );
      const inViewport = openCount
        ? await tooltip.first().evaluate((el) => {
            const r = el.getBoundingClientRect();
            return r.left >= 0 && r.right <= window.innerWidth;
          })
        : false;
      check("info tip bubble not clipped", inViewport);
      const hit = await first.evaluate((el) => {
        const cs = getComputedStyle(el, "::before");
        const base = el.getBoundingClientRect();
        const inset = Math.abs(parseFloat(cs.top) || 0);
        return base.width + inset * 2;
      });
      check("info tip hit target is 44px", hit >= 44, `${Math.round(hit)}px`);
      await page.screenshot({ path: path.join(OUT, "owner-tip-open.png") });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      check("ESC closes the info tip", (await tooltip.count()) === 0);
    }

    // TH locale · tips carry the provided Thai texts
    await page.evaluate(() => {
      document.cookie = "tkh-lang=th; path=/";
    });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(2500);
    const thTip = page.locator("button[aria-label][aria-expanded]").filter({
      has: page.locator("svg circle"),
    }).first();
    await thTip.click();
    await page.waitForTimeout(200);
    const thText = await page.locator("[role='tooltip']").first().innerText().catch(() => "");
    check(
      "info tip Thai text is the directive string",
      thText.includes("จำนวนห้องที่มีแขกเข้าพักคืนนี้"),
      thText.slice(0, 40)
    );
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      document.cookie = "tkh-lang=en; path=/";
    });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(2500);

    // Availability range control
    const grid = page.locator("section:last-of-type .grid").last();
    const colCount = async () =>
      grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    check("availability defaults to 7 day columns", (await colCount()) === 8, `${await colCount()} cols`);

    await page.click("button[aria-label='30 days']");
    await page.waitForTimeout(300);
    check("30-day segment widens the grid", (await colCount()) === 31, `${await colCount()} cols`);
    const sticky = await page
      .locator(".owner-sticky-col")
      .first()
      .evaluate((el) => getComputedStyle(el).position);
    check("room-name column is sticky", sticky === "sticky", sticky);
    const todayRing = await page.locator("[class*='ring-gold']").count();
    check("today column highlighted", todayRing >= 1, `${todayRing} ringed cells`);
    await page.screenshot({ path: path.join(OUT, "owner-avail-30.png") });

    const heading = () =>
      page.locator("section:last-of-type h2").last().innerText();
    const before = await heading();
    await page.click("button[aria-label='Next month']");
    await page.waitForTimeout(300);
    const after = await heading();
    check("next-month arrow jumps the window", before !== after, `"${before}" -> "${after}"`);
    const todayBtn = await page.locator("button", { hasText: /^Today$/ }).count();
    check("Today reset appears after jumping", todayBtn >= 1);
    await page.click("button[aria-label='7 days']");
    await page.waitForTimeout(200);
    await ctx.close();
  }

  // ── 8 · Owner CRUD persistence through the API ───────────────────────────
  {
    // Dining category
    const created = await fetchJson(`${BASE}/api/dining/categories`, {
      method: "POST",
      body: JSON.stringify({ name: { en: "QA Category", th: "QA Category" }, order: 99, published: true }),
    });
    check("dining category POST", created.ok && created.body?.id, created.body?.id ?? `${created.status}`);
    const catId = created.body?.id;

    // Dish under it
    const dish = await fetchJson(`${BASE}/api/dining/items`, {
      method: "POST",
      body: JSON.stringify({
        categoryId: catId,
        name: { en: "QA Dish", th: "QA Dish" },
        description: { en: "QA description line.", th: "QA description line." },
        price: 123,
        order: 0,
        published: true,
      }),
    });
    check("dining item POST", dish.ok && dish.body?.id, dish.body?.id ?? `${dish.status}`);
    const dishId = dish.body?.id;

    const patched = await fetchJson(`${BASE}/api/dining/items/${dishId}`, {
      method: "PATCH",
      body: JSON.stringify({ price: 456 }),
    });
    check("dining item PATCH persists", patched.ok && patched.body?.price === 456, `price=${patched.body?.price}`);

    let menu = await fetchJson(`${BASE}/api/dining`);
    let qaCat = (menu.body || []).find((c) => c.id === catId);
    check(
      "GET /api/dining reflects the new rows",
      Boolean(qaCat && qaCat.items.some((i) => i.id === dishId && i.price === 456))
    );

    // Unpublished never renders on the guest page
    await fetchJson(`${BASE}/api/dining/items/${dishId}`, {
      method: "PATCH",
      body: JSON.stringify({ published: false }),
    });
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });
    const guestText = await mainText(page);
    check("unpublished dish never renders for guests", !guestText.includes("QA Dish"));
    await ctx.close();

    const delDish = await fetchJson(`${BASE}/api/dining/items/${dishId}`, { method: "DELETE" });
    const delCat = await fetchJson(`${BASE}/api/dining/categories/${catId}`, { method: "DELETE" });
    menu = await fetchJson(`${BASE}/api/dining`);
    qaCat = (menu.body || []).find((c) => c.id === catId);
    check("dining DELETE cleans up", delDish.ok && delCat.ok && !qaCat);

    // Events
    const ev = await fetchJson(`${BASE}/api/events`, {
      method: "POST",
      body: JSON.stringify({
        title: { en: "QA Evening", th: "QA Evening" },
        date: "2030-01-15",
        description: { en: "QA event description.", th: "QA event description." },
        image: "",
        published: false,
      }),
    });
    check("event POST", ev.ok && ev.body?.id, ev.body?.id ?? `${ev.status}`);
    const evId = ev.body?.id;

    const evCtx = await contextFor(browser, { js: false });
    const evPage = await evCtx.newPage();
    await evPage.goto(BASE + "/events", { waitUntil: "load" });
    const evText = await mainText(evPage);
    check("unpublished event never renders for guests", !evText.includes("QA Evening"));

    const evPatch = await fetchJson(`${BASE}/api/events/${evId}`, {
      method: "PATCH",
      body: JSON.stringify({ published: true }),
    });
    await evPage.goto(BASE + "/events", { waitUntil: "load" });
    const evText2 = await mainText(evPage);
    check("published event renders for guests", evPatch.ok && evText2.includes("QA Evening"));
    await evCtx.close();

    const evDel = await fetchJson(`${BASE}/api/events/${evId}`, { method: "DELETE" });
    const evList = await fetchJson(`${BASE}/api/events`);
    check("event DELETE cleans up", evDel.ok && !(evList.body || []).some((e) => e.id === evId));
  }

  // ── 9 · Concierge · dining + events intents (offline fallback path) ──────
  {
    const ctx = await contextFor(browser, { js: true, width: 1280, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.click("[data-concierge-fab]");
    const input = page.locator("#concierge-input");
    await input.waitFor({ state: "visible", timeout: 15000 });

    await input.fill("What is on the menu?");
    await input.press("Enter");
    await page.waitForTimeout(3000);
    let hasDining = await page.locator("a[href='/dining']").count();
    check("concierge menu question links the dining page", hasDining >= 1, `${hasDining} links`);

    await input.fill("Can you host a wedding party?");
    await input.press("Enter");
    await page.waitForTimeout(2500);
    let hasEvents = await page.locator("a[href='/events']").count();
    check("concierge wedding question links the events page", hasEvents >= 1, `${hasEvents} links`);
    await page.screenshot({ path: path.join(OUT, "concierge-dining-events.png") });
    await ctx.close();
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

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
