/**
 * Thai text fit check.
 *
 * Thai runs longer than English for the same meaning and has no spaces to break
 * on, so a string that fit in EN can push a nav out of its bar or clip inside a
 * button. This looks for three failure modes on every guest route, in Thai, at
 * the widths the acceptance matrix cares about:
 *
 *   overflow · the document scrolls sideways
 *   clipped  · an element's text is taller/wider than its own padded box while
 *              overflow is hidden, so characters are cut off
 *   grown    · the header taller than its declared band, i.e. the nav wrapped
 *
 *   node scripts/th-overflow.js
 *   BASE=https://... node scripts/th-overflow.js
 */

const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";
const WIDTHS = [360, 390, 1093, 1366];
const ROUTES = [
  "/",
  "/dining",
  "/dining/reserve",
  "/events",
  "/events/reserve",
  "/rooms",
  "/facilities",
  "/experience",
  "/gallery",
  "/location",
  "/contact",
  "/offers",
  "/book",
];

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  if (!pass) console.log(`FAIL · ${name}${detail ? " · " + detail : ""}`);
}

async function run() {
  const browser = await chromium.launch();

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 500 ? 844 : 900 },
      timezoneId: "Asia/Bangkok",
    });
    await ctx.addCookies([{ name: "tkh-lang", value: "th", url: BASE }]);
    const page = await ctx.newPage();

    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForTimeout(1400);

      const info = await page.evaluate(() => {
        const over =
          document.documentElement.scrollWidth - window.innerWidth;

        // Clipped text · an element whose content is cut off by its own box.
        const clipped = [];
        for (const el of Array.from(document.querySelectorAll("body *"))) {
          const cs = getComputedStyle(el);
          if (cs.overflow === "visible" && cs.overflowX === "visible") continue;
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          // Only leaf-ish text nodes · a scroll container is allowed to scroll.
          if (el.children.length > 1) continue;
          const text = (el.textContent || "").trim();
          if (!text || text.length < 2) continue;
          if (!/[฀-๿]/.test(text)) continue;
          const cutX = el.scrollWidth - el.clientWidth > 1;
          const cutY = el.scrollHeight - el.clientHeight > 1;
          // auto/scroll are scroll containers; `clip` is a deliberate clip
          // (used to stop pre-animation transforms widening the page). Neither
          // is text being cut off by a box that was too small for it.
          const scrollable = ["auto", "scroll", "clip"].some(
            (v) => cs.overflowX === v || cs.overflowY === v
          );
          if ((cutX || cutY) && !scrollable) {
            clipped.push({
              tag: el.tagName,
              cls: (el.className || "").toString().slice(0, 40),
              text: text.slice(0, 40),
              dx: el.scrollWidth - el.clientWidth,
              dy: el.scrollHeight - el.clientHeight,
            });
          }
        }

        const header = document.querySelector("header");
        const headerH = header ? header.getBoundingClientRect().height : 0;

        return { over, clipped: clipped.slice(0, 5), headerH };
      });

      const label = `[${width}] ${route}`;
      check(`${label} no sideways scroll`, info.over <= 1, `${info.over}px`);
      check(
        `${label} no clipped Thai`,
        info.clipped.length === 0,
        info.clipped
          .map((c) => `${c.tag}.${c.cls} "${c.text}" +${c.dx}x${c.dy}`)
          .join(" | ")
      );
      const maxHeader = width >= 768 ? 66 : 58;
      check(
        `${label} header did not wrap`,
        info.headerH <= maxHeader,
        `${Math.round(info.headerH)}px <= ${maxHeader}`
      );
    }
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
