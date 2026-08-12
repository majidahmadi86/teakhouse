const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const url = "https://teakhouse.mikaro.studio/";
const out = process.argv[2] || ".psi-out.json";
const formFactor = process.argv[3] || "mobile";

const args = [
  "lighthouse",
  url,
  "--only-categories=performance,accessibility,best-practices,seo",
  `--form-factor=${formFactor}`,
  ...(formFactor === "desktop" ? ["--preset=desktop"] : []),
  "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
  "--output=json",
  `--output-path=${out}`,
  "--quiet",
];

try {
  execFileSync("npx", ["--yes", ...args], {
    stdio: "inherit",
    shell: true,
    cwd: __dirname + "/..",
  });
} catch (e) {
  // EPERM on chrome tmp cleanup is common on Windows; continue if report exists
}

const full = path.resolve(__dirname, "..", out);
if (!fs.existsSync(full)) {
  console.error("No report at", full);
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(full, "utf8"));
const s = (id) => Math.round(r.categories[id].score * 100);
console.log(
  formFactor.toUpperCase(),
  `P=${s("performance")} A=${s("accessibility")} BP=${s("best-practices")} SEO=${s("seo")}`
);
const a = r.audits;
console.log(
  "  LCP",
  a["largest-contentful-paint"].displayValue,
  "CLS",
  a["cumulative-layout-shift"].displayValue,
  "TBT",
  a["total-blocking-time"].displayValue
);
