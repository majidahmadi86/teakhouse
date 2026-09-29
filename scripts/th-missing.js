/**
 * Dictionary keys whose Thai slot is not Thai.
 *
 * The audit in th-leakage.js reports what a guest SEES; this reports the source
 * of it, so a translation pass has an exact worklist and can prove it is done.
 *
 *   node scripts/th-missing.js
 *   node scripts/th-missing.js --json
 */

const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "lib", "i18n-dict.ts"),
  "utf8"
);

const THAI = /[฀-๿]/;
const LATIN_WORD = /[A-Za-z]{3,}/;

/**
 * Latin that is CORRECT in a Thai value · brands, proper nouns, payment marks,
 * and the interpolation placeholders, whose names are code rather than copy.
 */
const NOT_COPY =
  // Technical tokens first, WITHOUT a word boundary requirement on the left ·
  // a route path, a file extension and an env var name are code. A Thai
  // sentence that names /dining, a jpg file or EMAIL_PROVIDER is still Thai.
  /\/[a-z-]+\b|\b(?:jpg|jpeg|png|webp|avif|csv|webhook|EMAIL_PROVIDER)\b|\{[a-z]+\}|\b(LINE|OTA|PIN|PDF|BTS|MRT|CSV|Google Maps|Google|Wi-?Fi|THB|USD|EUR|GBP|PromptPay|Visa|Mastercard|Agoda|Booking\.com|Booking|Mikaro Studio|The Teak House|Teak House|Nam|Claire|Daniel|Chao Phraya|Charoenkrung|Sriracha|Songkran|Loy Krathong|River Loft|Teak Suite|Garden Room|Courtyard Twin|Pier Studio|Mango Corner|Captain's Cabin|Family Annex|Attic Nook|Poolside Hide|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|tonight|today|tomorrow|weekend|next|the|this|week|night|nights)\b/gi;

/** Values that are correct without any Thai at all. */
const OK_WITHOUT_THAI = [
  /^LINE$/,
  /^LINE ID$/,
  /^[\d\s.,:/+()·%–-]+$/,
  /^\{[a-z]+\}[\s\d.,:·]*$/i,
  // Address, email and a pure brand line have nothing to translate.
  /^stay@teakhouse\.demo$/,
  /^LINE @teakhouse$/,
  /^Visa · Mastercard · PromptPay$/,
  /^The Teak House$/,
  /^OTA \d+%$/,
];

const entries = [];
const re = /"([A-Za-z0-9._]+)"\s*:\s*\{/g;
let m;
while ((m = re.exec(src))) {
  const key = m[1];
  // Walk to the matching brace so values containing { } (like "{n} days") are safe.
  let i = re.lastIndex;
  let depth = 1;
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") depth--;
    i++;
  }
  const body = src.slice(re.lastIndex, i - 1);
  const th = /th:\s*(?:"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/.exec(body);
  const en = /en:\s*(?:"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/.exec(body);
  if (!th) continue;
  const thVal = th[1] ?? th[2] ?? "";
  const enVal = en ? en[1] ?? en[2] ?? "" : "";
  const ok = THAI.test(thVal) || OK_WITHOUT_THAI.some((r) => r.test(thVal.trim()));
  // A value can contain Thai AND leftover English · flag those too, once the
  // brands and placeholders are stripped out.
  const leftover = THAI.test(thVal) && LATIN_WORD.test(thVal.replace(NOT_COPY, " "));
  if (!ok || leftover) {
    entries.push({ key, en: enVal, th: thVal, reason: ok ? "mixed" : "english" });
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(entries, null, 2));
} else {
  console.log(`${entries.length} keys need Thai\n`);
  const groups = {};
  for (const e of entries) {
    const ns = e.key.split(".")[0];
    (groups[ns] ??= []).push(e);
  }
  for (const [ns, list] of Object.entries(groups)) {
    console.log(`── ${ns} (${list.length})`);
    for (const e of list) {
      console.log(`   ${e.key.padEnd(24)} ${e.reason.padEnd(8)} ${e.en.slice(0, 70)}`);
    }
  }
}
