/**
 * Thai audit for the parts you cannot see.
 *
 * th-leakage.js reads innerText, so it is blind to exactly the copy that
 * screen-reader users and search engines get: image alt text, the document
 * title, the meta description and the openGraph card. All of that was still
 * English on a Thai page long after the visible copy was done.
 *
 * Fetches raw HTML (no browser · this is about markup, not rendering) for every
 * guest route in Thai and reports any of those values that still read English.
 *
 *   node scripts/th-meta-audit.js
 *   BASE=https://teakhouse.mikaro.studio node scripts/th-meta-audit.js
 */

const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3000";

/**
 * Static half of this audit.
 *
 * A rendering audit only sees what is on screen, so copy inside a dialog that
 * nobody opened is invisible to it · th-leakage called the owner panel CLEAN
 * while every "Add a dish" modal was still in English. This scans the SOURCE
 * for hard-coded English in the props that carry copy, which finds it whether
 * or not anything renders it.
 */
const COPY_PATTERNS = [
  // JSX attribute · label="Dish photo"
  /\s(?:label|hint|placeholder|aria-label|title|cancelLabel|saveLabel|emptyLabel|lead|eyebrow)="([A-Z][^"]{2,})"/g,
  // Object literal · { value: "yes", label: "Published" } · select options and
  // config arrays. The owner visibility dropdowns hid here, because a closed
  // <select> renders none of its options into innerText.
  /\b(?:label|title|hint|placeholder|heading)\s*:\s*"([A-Z][^"]{2,})"/g,
  // Ternary fallback · title={editing ? t("ow.edit") : "Add dish"} · half
  // translated, which reads as done until you open the OTHER branch.
  /\?\s*t\([^)]*\)\s*:\s*"([A-Z][^"]{2,})"/g,
];

/** Latin values that are correct as-is. */
const LITERAL_OK = [
  /^ADR$/,
  /^CVC$/,
  /^LINE ID$/,
  /^OTA$/,
  /^CSV$/,
  /^PDF$/,
  /^The Teak House$/,
  /^Teak House$/,
  /^Mikaro Studio$/,
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

function staticScan() {
  const files = [...walk("app"), ...walk("components")];
  const found = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    for (const pattern of COPY_PATTERNS) {
      let m;
      pattern.lastIndex = 0;
      while ((m = pattern.exec(src)) !== null) {
        const value = m[1];
        if (LITERAL_OK.some((re) => re.test(value))) continue;
        const line = src.slice(0, m.index).split("\n").length;
        found.push({ file: file.replace(/\\/g, "/"), line, value });
      }
    }
  }
  console.log("── static scan · hard-coded English in copy props ──");
  for (const f of found) {
    console.log(`  ${f.file}:${f.line}  ${f.value.slice(0, 70)}`);
  }
  console.log(
    found.length === 0
      ? "  none · every copy prop resolves through the dictionary"
      : `  ${found.length} literal${found.length === 1 ? "" : "s"} to route through the dictionary`
  );
  return found.length;
}

const ROUTES = [
  "/",
  "/rooms",
  "/rooms/river-loft",
  "/book",
  "/dining",
  "/dining/reserve",
  "/events",
  "/events/reserve",
  "/facilities",
  "/experience",
  "/gallery",
  "/location",
  "/contact",
  "/offers",
];

/** Latin that is correct inside Thai copy · brands and proper nouns. */
const BRAND =
  /\b(The Teak House|Teak House|Mikaro Studio|Chao Phraya|Charoenkrung|Charoen Krung|Bangkok|LINE|Wi-?Fi|BTS|MRT|PromptPay|Google|Agoda|Booking\.com|Songkran|River Loft|Teak Suite|Garden Room|Courtyard Twin|Pier Studio|Mango Corner|Captain's Cabin|Family Annex|Attic Nook|Poolside Hide)\b/gi;

/** Three or more Latin letters left after the brands are removed. */
const LATIN = /[A-Za-z]{3,}/;

function isThai(value) {
  const stripped = value.replace(BRAND, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
  return !LATIN.test(stripped);
}

function attr(html, re) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

async function main() {
  const literals = staticScan();
  console.log("");

  let bad = 0;
  let checked = 0;
  const emptyAlt = [];

  for (const route of ROUTES) {
    const res = await fetch(BASE + route, {
      headers: { cookie: "tkh-lang=th" },
    });
    const html = await res.text();

    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const desc =
      (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    const ogTitle =
      (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || "";
    const ogDesc =
      (html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] ||
      "";
    const ogLocale =
      (html.match(/<meta property="og:locale" content="([^"]*)"/) || [])[1] || "";
    // Non-empty alts only · alt="" is a correct, deliberate value for a
    // decorative image and there is nothing to translate.
    const alts = attr(html, /\salt="([^"]+)"/g);

    const fields = [
      ["title", title],
      ["description", desc],
      ["og:title", ogTitle],
      ["og:description", ogDesc],
      ...alts.map((a, i) => [`alt[${i}]`, a]),
    ].filter(([, v]) => v && v.trim());

    const leaks = fields.filter(([, v]) => !isThai(v));
    checked += fields.length;
    bad += leaks.length;
    if (!alts.length) emptyAlt.push(route);

    const localeOk = ogLocale === "th_TH";
    console.log(
      `${leaks.length === 0 && localeOk ? "CLEAN" : "LEAK "} ${route.padEnd(18)} ${String(
        fields.length
      ).padStart(3)} values · og:locale ${ogLocale || "(none)"}`
    );
    for (const [k, v] of leaks) console.log(`        · ${k}: ${v.slice(0, 88)}`);
    if (!localeOk) {
      bad += 1;
      console.log(`        · og:locale should be th_TH, got "${ogLocale}"`);
    }
  }

  // A route with no alt at all usually means the images are client-rendered ·
  // worth knowing, not a failure.
  if (emptyAlt.length) {
    console.log(`\nno alt attributes in raw HTML (client-rendered images): ${emptyAlt.join(", ")}`);
  }
  console.log(`\n${bad} English values across ${ROUTES.length} TH routes (${checked} checked)`);

  // The share-preview case · a crawler carries no cookie, so ?lang=th is the
  // only signal it can have.
  const shared = await fetch(`${BASE}/dining?lang=th`).then((r) => r.text());
  const sharedTitle = (shared.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const sharedLocale =
    (shared.match(/<meta property="og:locale" content="([^"]*)"/) || [])[1] || "";
  const shareOk = isThai(sharedTitle) && sharedLocale === "th_TH";
  console.log(
    `${shareOk ? "PASS" : "FAIL"} · cookieless ?lang=th share preview · "${sharedTitle}" ${sharedLocale}`
  );

  const enDefault = await fetch(`${BASE}/dining`).then((r) => r.text());
  const enTitle = (enDefault.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const enOk = /Dining/.test(enTitle);
  console.log(`${enOk ? "PASS" : "FAIL"} · no cookie and no param stays English · "${enTitle}"`);

  if (bad > 0 || !shareOk || !enOk || literals > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
