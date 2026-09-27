/**
 * v15 · Locale coverage gate.
 *
 * Every guest-facing dictionary key (everything that is not an `ow.` owner key)
 * must exist in every one of the fourteen translated locales, with the same
 * placeholders and the same HTML tags. Expect "16 languages · 0 gaps".
 *
 *   node scripts/locale-coverage.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dictFiles = ["lib/i18n-dict.ts", "lib/i18n-dict-v15.ts"];
const codes = ["zh", "ja", "ko", "ru", "de", "fr", "es", "it", "pt", "ar", "hi", "id", "vi", "ms"];

function guestKeys() {
  const out = {};
  for (const f of dictFiles) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    const re = /"([A-Za-z0-9._]+)"\s*:\s*\{/g;
    let m;
    while ((m = re.exec(src))) {
      const key = m[1];
      if (key.startsWith("ow.")) continue;
      let i = re.lastIndex;
      let depth = 1;
      while (i < src.length && depth > 0) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") depth--;
        i++;
      }
      const body = src.slice(re.lastIndex, i - 1);
      const en = /en:\s*(?:"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/.exec(body);
      if (en) out[key] = en[1] ?? en[2] ?? "";
    }
    const bare = /^\s{2}([a-z][A-Za-z0-9]*)\s*:\s*\{\s*en:\s*"((?:[^"\\]|\\.)*)"/gm;
    while ((m = bare.exec(src))) out[m[1]] = m[2];
  }
  return out;
}

function loadLocale(code) {
  const src = fs.readFileSync(path.join(root, "lib", "locales", `${code}.ts`), "utf8");
  const body = src.slice(src.indexOf("= {") + 2, src.lastIndexOf("}") + 1);
  const base = Function("return " + body)();
  const extraSrc = fs.readFileSync(path.join(root, "lib", "locales", "extra.ts"), "utf8");
  const extra = Function("return " + extraSrc.slice(extraSrc.indexOf("= {") + 2, extraSrc.lastIndexOf("}") + 1))();
  return { ...base, ...(extra[code] || {}) };
}

const placeholders = (s) => (s.match(/\{[a-z]+\}/g) || []).sort().join(",");
const tags = (s) => (s.match(/<[a-z]+\b/g) || []).sort().join(",");

const keys = guestKeys();
let gaps = 0;
for (const code of codes) {
  let locale;
  try {
    locale = loadLocale(code);
  } catch (e) {
    console.log(`FAIL ${code} · cannot load: ${e.message}`);
    gaps++;
    continue;
  }
  const missing = Object.keys(keys).filter((k) => typeof locale[k] !== "string" || !locale[k].trim());
  const badPh = Object.keys(keys).filter((k) => locale[k] && placeholders(keys[k]) !== placeholders(locale[k]));
  const badTags = Object.keys(keys).filter((k) => locale[k] && tags(keys[k]) !== tags(locale[k]));
  const problems = missing.length + badPh.length + badTags.length;
  gaps += problems;
  console.log(
    `${problems ? "FAIL" : "PASS"} ${code} · ${Object.keys(locale).length} strings` +
      (missing.length ? ` · missing ${missing.length} (${missing.slice(0, 3).join(", ")})` : "") +
      (badPh.length ? ` · placeholder mismatch ${badPh.length} (${badPh.slice(0, 3).join(", ")})` : "") +
      (badTags.length ? ` · tag mismatch ${badTags.length} (${badTags.slice(0, 3).join(", ")})` : "")
  );
}
console.log(`\n${codes.length + 2} languages · ${gaps} gaps · ${Object.keys(keys).length} guest keys`);
if (gaps) process.exitCode = 1;
