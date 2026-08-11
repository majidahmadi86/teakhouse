const { execFileSync } = require("child_process");
const fs = require("fs");

const base =
  process.env.LH_BASE ||
  "https://teakhouse-preview-git-feature-v8-system-miomika-s-projects.vercel.app";

function runOnce(path, form, out) {
  const args = [
    "lighthouse",
    base + path,
    "--only-categories=performance",
    `--form-factor=${form}`,
    "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
    "--output=json",
    `--output-path=${out}`,
    "--quiet",
  ];
  if (form === "desktop") args.push("--preset=desktop");
  try {
    execFileSync("npx", ["--yes", ...args], {
      stdio: "inherit",
      shell: true,
      cwd: __dirname + "/..",
    });
  } catch (_) {
    /* chrome tmp cleanup */
  }
  if (!fs.existsSync(out)) return null;
  const r = JSON.parse(fs.readFileSync(out, "utf8"));
  return {
    perf: Math.round(r.categories.performance.score * 100),
    lcp: r.audits["largest-contentful-paint"].displayValue,
    cls: r.audits["cumulative-layout-shift"].displayValue,
    tbt: r.audits["total-blocking-time"].displayValue,
  };
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const suites = [
  { path: "/", form: "mobile", key: "home-m", runs: 3 },
  { path: "/rooms", form: "mobile", key: "rooms-m", runs: 3 },
  { path: "/", form: "desktop", key: "home-d", runs: 1 },
  { path: "/rooms", form: "desktop", key: "rooms-d", runs: 1 },
];

const summary = {};

for (const suite of suites) {
  const scores = [];
  for (let i = 1; i <= suite.runs; i++) {
    const out = `.lh-gate-${suite.key}-${i}.json`;
    console.log(`=== ${suite.form} ${suite.path} run ${i}/${suite.runs} ===`);
    const s = runOnce(suite.path, suite.form, out);
    if (!s) {
      console.log("no report");
      continue;
    }
    console.log(`P=${s.perf} LCP=${s.lcp} CLS=${s.cls} TBT=${s.tbt}`);
    scores.push(s.perf);
    summary[`${suite.key}-${i}`] = s;
  }
  if (scores.length) {
    const med = median(scores);
    summary[`${suite.key}-median`] = med;
    summary[`${suite.key}-scores`] = scores;
    console.log(`>> MEDIAN ${suite.key} = ${med}  (runs: ${scores.join(", ")})`);
  }
}

fs.writeFileSync(".lh-gate-summary.json", JSON.stringify(summary, null, 2));

const homeMed = summary["home-m-median"];
const roomsMed = summary["rooms-m-median"];
const homeD = summary["home-d-1"]?.perf;
const roomsD = summary["rooms-d-1"]?.perf;

console.log("\n=== GATE ===");
console.log(`home mobile median: ${homeMed} (need >=94)`);
console.log(`rooms mobile median: ${roomsMed} (need >=90)`);
console.log(`home desktop: ${homeD} (need >=97)`);
console.log(`rooms desktop: ${roomsD} (need >=97)`);

const pass =
  homeMed >= 94 && roomsMed >= 90 && homeD >= 97 && roomsD >= 97;
console.log(pass ? "GATE PASS" : "GATE FAIL");
process.exit(pass ? 0 : 1);
