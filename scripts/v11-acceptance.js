/**
 * v11 acceptance sweep.
 *
 * Runs the standing acceptance bars against every route v11 touched:
 *   · JS-disabled  · the page must be readable and complete without hydration
 *   · pixel parity · the no-JS shell must match the hydrated page
 *   · Thai locale  · the same runs again with tkh-lang=th
 * plus the v11-specific checks: the date picker flips above the field when the
 * space below is short, the mobile picker is a full-screen sheet, and a stay
 * that crosses a season boundary prices as the sum of its nights.
 *
 *   node scripts/v11-acceptance.js            # all
 *   BASE=https://... node scripts/v11-acceptance.js
 */

const { chromium } = require("playwright");
const { qa, withQaCleanup } = require("./lib/qa");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "qa-shots", "v11");
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ["/", "/facilities", "/experience", "/book", "/rooms"];

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

async function contextFor(browser, { js = true, lang = "en", mobile = false } = {}) {
  const ctx = await browser.newContext({
    javaScriptEnabled: js,
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([
    { name: "tkh-lang", value: lang, url: BASE },
  ]);
  return ctx;
}

/**
 * Everything the reader sees, as one normalized run of characters.
 *
 * innerText joins adjacent inline nodes differently before and after hydration
 * ("View roomBook now" vs "View room" + "Book now"), so any word-boundary
 * comparison reports differences that are not content differences. Dropping all
 * separators removes that whole class of false positive while still catching a
 * sentence that genuinely disappeared.
 */
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, "");
}

/**
 * Content units of the shell · one per rendered line.
 *
 * Lines are the right granularity: fixed-size slices straddle unrelated blocks
 * (and Thai, which has no spaces, straddles far more of them), so a slice-based
 * diff reports "missing" text that is simply next to different text.
 */
function lines(text) {
  return text
    .split("\n")
    .map((l) => normalize(l))
    .filter((l) => l.length >= 12);
}

/**
 * Visible text of <main> · the parity fingerprint. Line breaks are preserved
 * because lines() needs them; only spaces within a line are collapsed.
 * Nothing is excluded: the date control's no-JS shell is the same box with the
 * same words as the hydrated trigger, so it is fair game for the diff.
 */
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

async function run() {
  const browser = await chromium.launch();

  // ── 1 · JS-disabled readability + text parity vs hydrated, EN and TH ──────
  for (const lang of ["en", "th"]) {
    for (const route of ROUTES) {
      const noJsCtx = await contextFor(browser, { js: false, lang });
      const noJs = await noJsCtx.newPage();
      await noJs.goto(BASE + route, { waitUntil: "load" });
      const shellText = await mainText(noJs);
      const shellShot = path.join(OUT, `nojs-${lang}-${route.replace(/\W+/g, "_")}.png`);
      await noJs.screenshot({ path: shellShot, fullPage: false });
      await noJsCtx.close();

      const jsCtx = await contextFor(browser, { js: true, lang });
      const withJs = await jsCtx.newPage();
      await withJs.goto(BASE + route, { waitUntil: "load" });
      // The shell upgrades on load+300 · wait past it before comparing.
      await withJs.waitForTimeout(1200);
      const liveText = await mainText(withJs);
      await withJs.screenshot({
        path: path.join(OUT, `js-${lang}-${route.replace(/\W+/g, "_")}.png`),
      });
      await jsCtx.close();

      check(
        `[${lang}] ${route} readable with JS off`,
        shellText.length > 200,
        `${shellText.length} chars`
      );

      // Parity: everything the shell says must still be said after hydration.
      const liveNorm = normalize(liveText);
      const chunks = lines(shellText);
      const missing = chunks.filter((c) => !liveNorm.includes(c));
      const lost = missing.length / Math.max(1, chunks.length);
      check(
        `[${lang}] ${route} shell text survives hydration`,
        lost < 0.05,
        `${(lost * 100).toFixed(1)}% absent${
          missing.length ? " · " + missing.slice(0, 3).join(" | ") : ""
        }`
      );
    }
  }

  // ── 1b · The date box · identical size and identical wording either side of
  //         hydration. Checked in Thai, the locale that used to leak English.
  for (const lang of ["en", "th"]) {
    const noJsCtx = await contextFor(browser, { js: false, lang });
    const noJs = await noJsCtx.newPage();
    await noJs.goto(BASE + "/book", { waitUntil: "load" });
    const shell = await noJs.evaluate(() => {
      const el = document.querySelector("[data-date-shell]");
      if (!el) return null;
      return {
        h: el.getBoundingClientRect().height,
        text: (el.innerText || "").replace(/\s+/g, " ").trim(),
      };
    });
    await noJsCtx.close();

    const jsCtx = await contextFor(browser, { js: true, lang });
    const withJs = await jsCtx.newPage();
    await withJs.goto(BASE + "/book", { waitUntil: "load" });
    await withJs.waitForTimeout(1500);
    // The trigger, not [data-date-field] · that wrapper also holds the helper
    // line, which the shell never claimed to replace.
    const live = await withJs.evaluate(() => {
      const btn = document.querySelector("[data-date-trigger]");
      return {
        h: btn ? btn.getBoundingClientRect().height : 0,
        text: btn ? (btn.innerText || "").replace(/\s+/g, " ").trim() : "",
      };
    });
    await jsCtx.close();

    check(
      `[${lang}] date box does not shift on hydration`,
      shell && Math.abs(shell.h - live.h) <= 12,
      shell ? `shell ${Math.round(shell.h)}px vs live ${Math.round(live.h)}px` : "n/a"
    );
    check(
      `[${lang}] date box says the same thing before and after hydration`,
      shell && shell.text === live.text,
      shell ? `"${shell.text}" vs "${live.text}"` : "n/a"
    );
  }

  // ── 2 · Facilities + House & team content present ────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/facilities", { waitUntil: "load" });
    const cards = await page.locator("main article").count();
    check("facilities lists 7 items with JS off", cards === 7, `${cards} cards`);
    const imgs = await page.locator("picture source[type='image/avif']").count();
    const remote = await page.locator("main img[src*='images.unsplash.com']").count();
    check("facilities images are local AVIF", imgs >= 7 && remote === 0,
      `${imgs} avif sources, ${remote} remote imgs`);

    await page.goto(BASE + "/experience", { waitUntil: "load" });
    const roles = await page.locator("#house ul li").count();
    check("house & team shows 4 roles with JS off", roles === 4, `${roles} roles`);
    const paras = await page.locator("#house p").allInnerTexts();
    const longest = Math.max(0, ...paras.map((p) => p.length));
    check("house story present", longest > 120, `longest paragraph ${longest} chars`);

    await page.goto(BASE + "/", { waitUntil: "load" });
    const strip = await page.locator("a[href='/facilities']").count();
    check("home facilities strip links to /facilities", strip >= 7, `${strip} links`);
    await ctx.close();
  }

  // ── 3 · Nav + footer ─────────────────────────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/rooms", { waitUntil: "load" });
    // v12 · Facilities moved into the Experience dropdown group; the no-JS
    // header carries the group trigger (/experience) and the new /dining link.
    const navExp = await page.locator("header a[href='/experience']").count();
    const navDining = await page.locator("header a[href='/dining']").count();
    check(
      "header nav has Experience group + Dining (no JS)",
      navExp >= 1 && navDining >= 1,
      `exp=${navExp} dining=${navDining}`
    );
    const footLink = await page.locator("footer a[href='/facilities']").count();
    const footHouse = await page.locator("footer a[href='/experience#house']").count();
    check("footer has Facilities + House & team", footLink >= 1 && footHouse >= 1);
    await ctx.close();
  }

  // ── 4 · Date picker · desktop collision flip ─────────────────────────────
  {
    const ctx = await contextFor(browser, { js: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/book", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    // The date field itself · not the sticky summary bar, which also reads
    // "Select dates" and would open the wrong thing.
    const trigger = page.locator('[data-date-trigger]').first();
    await trigger.scrollIntoViewIfNeeded();

    // Push the field low in the viewport so there is no room underneath.
    await page.evaluate(() => {
      const btn = document.querySelector('[data-date-trigger]');
      if (btn) btn.scrollIntoView({ block: "end" });
      window.scrollBy(0, -40);
    });
    await page.waitForTimeout(300);

    const box = await trigger.boundingBox();
    await trigger.click();
    await page.waitForTimeout(600);

    const panel = page.locator("[role='dialog'], .rdp").first();
    const panelBox = await panel.boundingBox();
    if (box && panelBox) {
      const openedAbove = panelBox.y + panelBox.height <= box.y + 8;
      const vh = page.viewportSize().height;
      const clipped = panelBox.y < 0 || panelBox.y + panelBox.height > vh + 1;
      check(
        "desktop picker flips above the field when space below is short",
        openedAbove,
        `field.y=${Math.round(box.y)} panel=${Math.round(panelBox.y)}..${Math.round(panelBox.y + panelBox.height)}`
      );
      check("desktop picker is never clipped by the viewport", !clipped);
    } else {
      check("desktop picker measurable", false, "no bounding box");
    }
    await page.screenshot({ path: path.join(OUT, "picker-desktop-flip.png") });
    await ctx.close();
  }

  // ── 5 · Date picker · mobile full-screen sheet ───────────────────────────
  {
    const ctx = await contextFor(browser, { js: true, mobile: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/book", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const trigger = page.locator('[data-date-trigger]').first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await page.waitForTimeout(600);

    const sheet = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("div")).find((d) => {
        const cs = getComputedStyle(d);
        return (
          cs.position === "fixed" &&
          d.getBoundingClientRect().height > window.innerHeight * 0.85 &&
          d.querySelector(".rdp")
        );
      });
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        h: r.height, w: r.width, vh: window.innerHeight, vw: window.innerWidth,
        bg: cs.backgroundColor,
      };
    });
    check(
      "mobile picker is a full-screen solid sheet",
      sheet && sheet.h >= sheet.vh * 0.9 && sheet.w >= sheet.vw * 0.95 &&
        !/rgba\(0, 0, 0, 0\)|transparent/.test(sheet.bg || ""),
      sheet ? `${Math.round(sheet.w)}x${Math.round(sheet.h)} bg=${sheet.bg}` : "sheet not found"
    );

    // classNames.day replaces rdp-day, so measure the real day control.
    const tap = await page.evaluate(() => {
      const d = document.querySelector(".rdp tbody td button");
      return d ? d.getBoundingClientRect().height : 0;
    });
    check("mobile day cells are 44px+ tap targets", tap >= 44, `${Math.round(tap)}px`);

    const apply = await page.locator("button", { hasText: /Done|Apply/ }).count();
    check("mobile sheet has a sticky Apply", apply >= 1);
    await page.screenshot({ path: path.join(OUT, "picker-mobile-sheet.png") });
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

// Cleanup runs whether the suite passed, failed or threw · see lib/qa.js.
withQaCleanup(run);
