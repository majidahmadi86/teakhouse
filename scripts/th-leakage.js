/**
 * Thai locale leakage audit.
 *
 * Loads every guest surface with tkh-lang=th and reports which visible lines
 * still read as English. Latin text is not automatically a fault · brand names,
 * "LINE", currency codes and clock times are correct in Thai copy · so the
 * allow-list below is explicit and everything outside it is reported.
 *
 *   node scripts/th-leakage.js
 *   BASE=https://... node scripts/th-leakage.js
 */

const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";

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

/** Latin that is CORRECT inside Thai copy. */
const ALLOWED = [
  /^the teak house$/i,
  /^teak house$/i,
  /^mikaro studio$/i,
  /^line$/i,
  /^line @teakhouse$/i,
  /^@teakhouse$/i,
  /^en$/i,
  /^thb$/i,
  /^฿\s?thb$/i,
  /^usd$/i,
  /^eur$/i,
  /^gbp$/i,
  /^google$/i,
  /^promptpay$/i,
  /^visa$/i,
  /^mastercard$/i,
  /^wifi$/i,
  /^tv$/i,
  /^id$/i,
  /^sriracha$/i,
  // Room names ship as Latin on purpose (they are the property's own names).
  /^(river loft|teak suite|garden room|courtyard twin|pier studio|mango corner|captain's cabin|family annex|attic nook|poolside hide)$/i,
  /^(king|queen|twin) bed$/i,
  // Codes, numerals, dates, prices, times.
  /^[\d\s.,:/+()·%–-]+$/,
  /^(TBL|EVT|TKH|AGD|BKG)-[A-Z0-9]+$/,
  /^[฀-๿\s\d.,:·%()+/–-]+$/, // pure Thai (plus punctuation/numerals)
];

/**
 * Latin tokens that are correct even in the middle of a Thai sentence · proper
 * nouns and brands a Thai speaker would also write in Latin. Stripped before
 * judging the line, so "ห่าง BTS เพียง 6 นาที" reads as Thai (it is).
 */
const BRAND_TOKENS =
  /\b(BTS|MRT|Google Maps|Google|LINE|Wi-?Fi|THB|USD|EUR|GBP|PromptPay|Teak House|The Teak House|Mikaro Studio|Chao Phraya|Charoenkrung|Agoda|Booking\.com|Booking|Sriracha|Songkran|Loy Krathong|khan tok|River Loft|Teak Suite|Garden Room|Courtyard Twin|Pier Studio|Mango Corner|Captain's Cabin|Family Annex|Attic Nook|Poolside Hide)\b/gi;

/** A line counts as English if it has a run of >=3 Latin letters. */
const LATIN_WORD = /[A-Za-z]{3,}/;

function isAllowed(line) {
  const t = line.trim();
  if (!t) return true;
  if (!LATIN_WORD.test(t)) return true;
  if (ALLOWED.some((re) => re.test(t))) return true;
  // Strip the permitted proper nouns · if nothing English is left, it is Thai.
  const stripped = t.replace(BRAND_TOKENS, " ");
  return !LATIN_WORD.test(stripped);
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    timezoneId: "Asia/Bangkok",
  });
  await ctx.addCookies([{ name: "tkh-lang", value: "th", url: BASE }]);
  const page = await ctx.newPage();

  let total = 0;
  const report = [];

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // <main> only · the demo chrome bar above it is intentionally bilingual.
    const lines = await page.evaluate(() => {
      const el = document.querySelector("main") || document.body;
      return (el.innerText || "")
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    });
    const leaks = [...new Set(lines.filter((l) => !isAllowed(l)))];
    total += leaks.length;
    report.push({ route, lines: lines.length, leaks });
    console.log(
      `${leaks.length === 0 ? "CLEAN" : "LEAK "} ${route.padEnd(18)} ${lines.length} lines${
        leaks.length ? " · " + leaks.length + " english" : ""
      }`
    );
    for (const l of leaks.slice(0, 8)) console.log("        ·", l.slice(0, 96));
  }

  console.log(`\n${total} English lines across ${ROUTES.length} TH routes`);
  await ctx.close();
  await browser.close();
  if (total > 0) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
