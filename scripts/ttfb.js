/**
 * Per-route TTFB probe · the before/after instrument for v14's navigation work.
 *
 * Measures time to first byte for a cold request and then warm repeats, because
 * the two answer different questions: cold is what a guest hitting a rarely
 * visited route pays, warm is what the demo feels like once it is being used.
 *
 *   BASE=https://... node scripts/ttfb.js
 *   BASE=... RUNS=5 node scripts/ttfb.js
 */

const BASE = process.env.BASE || "http://localhost:3000";
const RUNS = Number(process.env.RUNS || 4);
const TAG = process.env.TAG || "";

const ROUTES = [
  "/",
  "/rooms",
  "/rooms/river-loft",
  "/dining",
  "/dining/reserve",
  "/events",
  "/facilities",
  "/experience",
  "/gallery",
  "/location",
  "/contact",
  "/offers",
  "/book",
  "/owner",
  "/owner/bookings",
  "/owner/rooms",
  "/owner/dining",
  "/owner/events",
];

async function ttfb(url) {
  const start = process.hrtime.bigint();
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  // First byte · read one chunk rather than the whole body.
  const reader = res.body?.getReader();
  if (reader) {
    await reader.read();
    await reader.cancel().catch(() => {});
  }
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return { ms, status: res.status, cache: res.headers.get("x-vercel-cache") || "" };
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function main() {
  console.log(`TTFB · ${BASE}${TAG ? " · " + TAG : ""} · ${RUNS} warm runs\n`);
  console.log("route".padEnd(22), "cold".padStart(8), "warm".padStart(8), "  status  cache");
  const rows = [];
  for (const route of ROUTES) {
    const url = BASE + route;
    let cold;
    try {
      cold = await ttfb(url);
    } catch (e) {
      console.log(route.padEnd(22), "ERR".padStart(8), String(e.message).slice(0, 40));
      continue;
    }
    const warm = [];
    let last = cold;
    for (let i = 0; i < RUNS; i++) {
      try {
        last = await ttfb(url);
        warm.push(last.ms);
      } catch {
        /* keep going */
      }
    }
    const w = warm.length ? median(warm) : NaN;
    rows.push({ route, cold: cold.ms, warm: w, status: cold.status, cache: last.cache });
    console.log(
      route.padEnd(22),
      `${cold.ms.toFixed(0)}ms`.padStart(8),
      `${w.toFixed(0)}ms`.padStart(8),
      `  ${cold.status}`.padEnd(8),
      last.cache
    );
  }

  const guest = rows.filter((r) => !r.route.startsWith("/owner"));
  const owner = rows.filter((r) => r.route.startsWith("/owner"));
  const avg = (xs) => (xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(0);
  console.log(
    `\nwarm median · guest ${avg(guest.map((r) => r.warm))}ms · owner ${avg(owner.map((r) => r.warm))}ms`
  );
  const over = rows.filter((r) => r.warm > 1000);
  console.log(`routes over 1s warm: ${over.length ? over.map((r) => r.route).join(", ") : "none"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
