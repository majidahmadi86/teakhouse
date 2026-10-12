/**
 * The not-found page logs nothing · loads unknown paths at a phone and a
 * desktop width and fails on any console error or page error other than the
 * document's own 404 status.
 *
 *   BASE=http://localhost:3010 node scripts/notfound-console.js
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3010";
const PATHS = ["/journey", "/destinations", "/rooms/no-such-room", "/journey?lang=th", "/rooms/no-such-room?lang=th"];
const WIDTHS = [320, 390, 1366, 1920];

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    for (const path of PATHS) {
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        // The document itself is a 404: Chrome reports that as a console error.
        if (/Failed to load resource.*404/.test(m.text()) && m.location().url.replace(/\?.*$/, "") === BASE + path.replace(/\?.*$/, "")) return;
        errors.push(`console: ${m.text()} @ ${m.location().url}`);
      });
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const status = res ? res.status() : 0;
      const htmlCount = await page.evaluate(() => document.querySelectorAll("html").length);
      const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() ?? "");
      const ok = status === 404 && errors.length === 0 && htmlCount === 1 && h1 !== "";
      if (!ok) failed++;
      console.log(`${ok ? "PASS" : "FAIL"} ${width} ${path} status=${status} h1="${h1}"${errors.map((e) => "\n    " + e).join("")}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(failed ? `${failed} failing` : "all clean");
  process.exit(failed ? 1 : 0);
})();
