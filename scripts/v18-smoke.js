/**
 * v18 · smoke · every guest and owner page at 390 and 1366: HTTP 200, zero console errors
 * (page errors and console.error), and no sideways scroll. Read-only: it opens pages and the
 * owner panel's "How this page works" drawer, it books nothing.
 *
 *   BASE=http://localhost:3030 node scripts/v18-smoke.js
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3030";
const GUEST = (process.env.GUEST || "/,/destinations,/destinations/bangkok,/destinations/phuket,/destinations/chiangmai,/destinations/bali,/rooms,/rooms/river-suite,/reserve,/trip,/my-trip,/occasions,/journey,/estate,/dining,/events,/offers,/the-solenne-engine,/agents,/contact,/location,/gallery,/?lang=th,/rooms?lang=th,/offers?lang=th,/agents?lang=th").split(",");
const OWNER = (process.env.OWNER || "/owner,/owner/desk,/owner/bookings,/owner/trips,/owner/calendar,/owner/messages,/owner/enquiries,/owner/amenities,/owner/rooms,/owner/rates,/owner/packages,/owner/dining,/owner/events,/owner/estate,/owner/journeys,/owner/trip-packages,/owner/agents,/owner/channels,/owner/settings,/owner/houses,/owner/help").split(",");
const WIDTHS = (process.env.WIDTHS || "390,1366").split(",").map(Number);
// Known third-party noise that is not the site's: analytics beacons that only exist on Vercel.
const IGNORE = [/_vercel\/(insights|speed-insights)/, /vitals\.vercel/];

(async () => {
  const b = await chromium.launch();
  const fails = [];
  let checks = 0;
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } });
    const p = await ctx.newPage();
    let errs = [];
    p.on("pageerror", (e) => errs.push("pageerror: " + String(e.message || e).slice(0, 160)));
    p.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (IGNORE.some((r) => r.test(t) || r.test(m.location()?.url || ""))) return;
      errs.push("console: " + t.slice(0, 160));
    });
    for (const route of [...GUEST, ...OWNER]) {
      errs = [];
      const sep = route.includes("?") ? "&" : "?";
      let status = 0;
      try {
        const res = await p.goto(`${BASE}${route}${route.startsWith("/owner") ? "" : sep + "sv-nosplash"}`, { waitUntil: "load", timeout: 60000 });
        status = res ? res.status() : 0;
        await p.waitForTimeout(route.startsWith("/owner") ? 2500 : 900);
        if (route.startsWith("/owner")) {
          const guide = p.locator(process.env.GUIDE_SEL || "[data-page-guide]").first();
          if (route !== "/owner/help") await guide.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
          if (route !== "/owner/help" && !(await guide.count())) errs.push("no page guide button");
          else if (await guide.count()) {
            await guide.click();
            await p.waitForTimeout(400);
            await p.keyboard.press("Escape");
            await p.waitForTimeout(250);
          }
        }
        const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (over > 1) errs.push(`sideways scroll ${over}px`);
      } catch (e) {
        errs.push("load: " + String(e.message || e).slice(0, 120));
      }
      checks++;
      if (status !== 200) errs.unshift(`status ${status}`);
      if (errs.length) fails.push(`[${w}] ${route} · ${[...new Set(errs)].join(" | ")}`);
    }
    await ctx.close();
  }
  await b.close();
  for (const f of fails) console.log("FAIL", f);
  console.log(`v18-smoke · ${checks - fails.length}/${checks} pages clean`);
  process.exitCode = fails.length ? 1 : 0;
})();
