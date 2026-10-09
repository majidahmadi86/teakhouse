/**
 * v17 screenshots for Mike · docs/v17-shots/teakhouse/
 * home, /rooms, a room page and every /book step (Room with a room in the
 * dock, Details, Confirmed) at 1366x768 and 390x844, in English and Thai.
 * The booking it confirms goes through qa() and is purged afterwards.
 *
 *   BASE=http://localhost:3000 node scripts/v17-shots.js
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { qa, withQaCleanup } = require("./lib/qa");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "v17-shots", "teakhouse");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const lang of ["en", "th"]) {
    for (const [w, h] of [[1366, 768], [390, 844]]) {
      const mobile = w < 768;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
      await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
      const page = await ctx.newPage();
      const shot = async (name, full = false) => {
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(OUT, `${name}-${lang}-${w}.png`), fullPage: full });
      };
      const settle = async () => {
        // Bring every lazy, decode-gated image in before a full-page shot.
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1200);
      };
      for (const [route, name] of [["/", "home"], ["/rooms", "rooms"], ["/rooms/teak-suite", "room-teak-suite"]]) {
        await page.goto(BASE + route, { waitUntil: "load" });
        await shot(name);
        await settle();
        await shot(`${name}-full`, true);
      }
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(800);
      await Promise.all([
        page.waitForURL(/\/book/),
        page.locator('#tkh-hero-actions form[data-stay-search] button[type="submit"]').click(),
      ]);
      await page.locator('li[id^="room-"]').first().waitFor();
      await shot("book-1-rooms");
      await page.locator("#room-premier-river button[aria-pressed]").click();
      await shot("book-1-selected");
      await page.locator("[data-dock-action]").click();
      await shot("book-2-details");
      await page.locator('input[autocomplete="name"]').fill(qa(`Shots ${lang} ${w}`));
      await page.locator('input[type="email"]').fill("shots@example.test");
      await page.locator('input[type="tel"]').fill("+66 81 234 5678");
      await page.locator("[data-dock-action]").click();
      await page.locator("#tkh-receipt").waitFor();
      await shot("book-3-confirmed");
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`screenshots in ${path.relative(process.cwd(), OUT)}`);
}

withQaCleanup(main);
