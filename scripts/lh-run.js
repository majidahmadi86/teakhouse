// 3-run mobile Lighthouse median for a given URL (LH_URL, LH_TAG).
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const URL = process.env.LH_URL || "http://localhost:3000/";
const TAG = process.env.LH_TAG || "home";
const scores = [];
const details = [];

for (let i = 1; i <= 3; i++) {
  const out = path.join(__dirname, `..`, `.lh-${TAG}-${i}.json`);
  const args = [
    "--yes", "lighthouse", URL,
    "--only-categories=performance",
    "--form-factor=mobile", "--screenEmulation.mobile",
    "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
    "--output=json", `--output-path=${out}`, "--quiet",
  ];
  try {
    execFileSync("npx", args, { stdio: "inherit", shell: true, cwd: path.join(__dirname, "..") });
  } catch (e) { /* chrome temp cleanup */ }
  if (!fs.existsSync(out)) { console.log(`RUN ${i}: NO OUTPUT`); continue; }
  const r = JSON.parse(fs.readFileSync(out, "utf8"));
  const perf = Math.round(r.categories.performance.score * 100);
  scores.push(perf);
  details.push({ run: i, perf, lcp: r.audits["largest-contentful-paint"].displayValue, cls: r.audits["cumulative-layout-shift"].displayValue, tbt: r.audits["total-blocking-time"].displayValue });
  console.log(`RUN ${i}: perf=${perf}`);
}
const sorted = [...scores].sort((a, b) => a - b);
console.log("\n=== RESULTS ===");
console.log(JSON.stringify({ url: URL, tag: TAG, scores, median: sorted[Math.floor(sorted.length / 2)], details }, null, 2));
console.log(`\nMEDIAN=${sorted[Math.floor(sorted.length / 2)]}`);
