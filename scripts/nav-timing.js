/**
 * Perceived navigation timing · what a guest actually waits for.
 *
 * TTFB alone hides the problem the owner reported ("over 3s per page change"),
 * because the owner panel answers fast and then fetches its data client-side.
 * This measures two things per hop:
 *   firstPaint · when ANYTHING branded appears (skeleton counts · that is the
 *                point of a skeleton)
 *   content    · when the real content for that route is on screen
 *
 *   BASE=https://... node scripts/nav-timing.js
 */

const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";
const TAG = process.env.TAG || "";

/** Each hop: click this link, then wait for this content to exist. */
const HOPS = [
  { from: "/", link: "a[href='/dining']", to: "/dining", content: "text=What the kitchen sends out" },
  { from: "/dining", link: "a[href='/events']", to: "/events", content: "text=On the house calendar" },
  { from: "/events", link: "a[href='/rooms']", to: "/rooms", content: "main article" },
  { from: "/rooms", link: "a[href='/facilities']", to: "/facilities", content: "main article" },
  { from: "/", link: "a[href='/contact']", to: "/contact", content: "form" },
];

/** Owner hops go through the owner shell, which fetches after mount. */
const OWNER_HOPS = [
  { from: "/owner", link: "a[href='/owner/bookings']", to: "/owner/bookings", content: "text=Add booking" },
  { from: "/owner", link: "a[href='/owner/dining']", to: "/owner/dining", content: "text=Table reservations" },
  { from: "/owner", link: "a[href='/owner/rooms']", to: "/owner/rooms", content: "text=Add room" },
];

async function timeHop(page, hop) {
  await page.goto(BASE + hop.from, { waitUntil: "load" });
  await page.waitForTimeout(1400); // let the origin page settle and hydrate
  // The owner sidebar only exists once the store has hydrated · waiting for the
  // link is part of measuring honestly, not a workaround.
  await page
    .locator(hop.link)
    .first()
    .waitFor({ state: "visible", timeout: 30000 })
    .catch(() => {});

  const started = Date.now();
  let firstPaint = null;

  // Any change of route chrome counts as the first visual response.
  const paintWatch = page
    .waitForFunction(
      (target) => location.pathname === target,
      hop.to,
      { timeout: 20000 }
    )
    .then(() => {
      if (firstPaint === null) firstPaint = Date.now() - started;
    })
    .catch(() => {});

  await page.click(hop.link).catch(() => {});
  await paintWatch;

  let content = null;
  try {
    await page.locator(hop.content.split(", ")[0]).first().waitFor({ state: "visible", timeout: 25000 });
    content = Date.now() - started;
  } catch {
    content = NaN;
  }
  return { firstPaint: firstPaint ?? NaN, content };
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    timezoneId: "UTC",
  });
  const page = await ctx.newPage();

  console.log(`Perceived navigation · ${BASE}${TAG ? " · " + TAG : ""}\n`);
  console.log("hop".padEnd(34), "route swap".padStart(12), "content".padStart(10));

  const all = [];
  for (const hop of [...HOPS, ...OWNER_HOPS]) {
    const r = await timeHop(page, hop);
    all.push({ ...hop, ...r });
    console.log(
      `${hop.from} -> ${hop.to}`.padEnd(34),
      `${Number.isNaN(r.firstPaint) ? "n/a" : r.firstPaint + "ms"}`.padStart(12),
      `${Number.isNaN(r.content) ? "TIMEOUT" : r.content + "ms"}`.padStart(10)
    );
  }

  const done = all.filter((r) => !Number.isNaN(r.content));
  const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
  const guest = done.filter((r) => !r.to.startsWith("/owner"));
  const owner = done.filter((r) => r.to.startsWith("/owner"));
  console.log(
    `\naverage content · guest ${avg(guest.map((r) => r.content))}ms · owner ${avg(owner.map((r) => r.content))}ms`
  );
  const slow = done.filter((r) => r.content > 3000);
  console.log(`hops over 3s: ${slow.length ? slow.map((r) => r.to).join(", ") : "none"}`);

  await ctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
