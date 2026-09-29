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

const GUEST_ROUTES = [
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

/**
 * The owner panel is client-rendered behind a store fetch, so it needs longer
 * to settle than a guest page and is measured from <body> · its chrome (the
 * sidebar, the demo bar) is part of the surface an owner reads.
 */
const OWNER_ROUTES = [
  "/owner",
  "/owner/bookings",
  "/owner/rooms",
  "/owner/dining",
  "/owner/events",
  "/owner/messages",
  "/owner/rates",
  "/owner/calendar",
  "/owner/settings",
];

const ROUTES = process.env.OWNER === "1" ? OWNER_ROUTES : GUEST_ROUTES;
const IS_OWNER = process.env.OWNER === "1";

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
  // An address is an address, and the reviewers are named people · both are
  // correct in Latin on a Thai page.
  /^stay@teakhouse\.demo$/i,
  /^(claire|daniel|marco|emma|james|sofia|anna|hannah|oliver|lucas|yuki|chen|li|raj|tom|sarah)\b/i,
  // Owner tables render DATA · a booking row is a code, a guest's name, a room
  // name, a source brand and a Thai status. The rate-rule labels are whatever
  // the owner typed. None of it is interface copy, none of it is ours to
  // translate, and the rule label is a single non-localized column by design.
  /^(TKH|AGD|BKG)-\d+ /,
  /^(Direct|Agoda|Booking)$/,
  /^(High season|Weekend premium)$/,
  // Email-template placeholders are code · they must stay verbatim or the
  // substitution stops working.
  /^\{\{[a-zA-Z]+\}\}$/,
  /^EMAIL_PROVIDER$/,
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
  // Acronyms and paths first, WITHOUT a leading word boundary · the owner tables
  // render "฿1,900OTA ฿2,300" with no space, so \bOTA would never match there.
  /(?:OTA|ADR|CSV|PDF|CVC|webhook|EMAIL_PROVIDER)|\/[a-z-]+\b|\b(BTS|MRT|Google Maps|Google|LINE|Wi-?Fi|THB|USD|EUR|GBP|PromptPay|Teak House|The Teak House|Mikaro Studio|Chao Phraya|Charoenkrung|Agoda|Booking\.com|Booking|Sriracha|Songkran|Loy Krathong|khan tok|River Loft|Teak Suite|Garden Room|Courtyard Twin|Pier Studio|Mango Corner|Captain's Cabin|Family Annex|Attic Nook|Poolside Hide)\b/gi;

/**
 * A line counts as English if it has a run of >=3 Latin letters, OR one of the
 * short connective words that hide between Thai and numerals. The >=3 rule
 * alone let "ให้บริการ 11:30 to 22:00" through, which is exactly the kind of
 * leak this audit exists to catch.
 */
const LATIN_WORD = /[A-Za-z]{3,}|(?:^|[\s·])(?:to|and|or|at|by|of|in|on)(?=[\s·]|$)/;

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
  let empty = 0;
  const report = [];

  /**
   * A route that renders nothing has no English on it, so a fixed wait that
   * expired early reported CLEAN · this audit's own worst failure mode, and it
   * happened for real on /owner/rates when the machine was busy. Wait for
   * CONTENT, then refuse to grade a surface that never arrived.
   */
  const MIN_LINES = 5;

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load" });
    // The owner panel mounts a dynamic import after its store fetch resolves.
    await page
      .waitForFunction(
        (sel) => {
          const el = document.querySelector(sel) || document.body;
          return (el.innerText || "").trim().length > 200;
        },
        IS_OWNER ? ".own-theme" : "main",
        { timeout: 25000 }
      )
      .catch(() => {});
    await page.waitForTimeout(IS_OWNER ? 2500 : 800);
    const lines = await page.evaluate((isOwner) => {
      const el = isOwner
        ? document.querySelector(".own-theme") || document.body
        : document.querySelector("main") || document.body;
      return (el.innerText || "")
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    }, IS_OWNER);
    const leaks = [...new Set(lines.filter((l) => !isAllowed(l)))];
    const tooThin = lines.length < MIN_LINES;
    if (tooThin) empty += 1;
    total += leaks.length;
    report.push({ route, lines: lines.length, leaks, tooThin });
    const verdict = tooThin ? "EMPTY" : leaks.length === 0 ? "CLEAN" : "LEAK ";
    console.log(
      `${verdict} ${route.padEnd(18)} ${lines.length} lines${
        leaks.length ? " · " + leaks.length + " english" : ""
      }${tooThin ? " · NOT GRADED, surface did not render" : ""}`
    );
    for (const l of leaks.slice(0, 60)) console.log("        ·", l.slice(0, 96));
  }

  console.log(`\n${total} English lines across ${ROUTES.length} TH routes`);
  if (empty) {
    console.log(
      `${empty} route${empty === 1 ? "" : "s"} rendered nothing · that is a failed audit, not a clean one`
    );
  }
  await ctx.close();
  await browser.close();
  if (total > 0 || empty > 0) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
