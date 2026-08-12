const { execFileSync } = require("child_process");
const fs = require("fs");

const base =
  process.env.LH_BASE ||
  "https://teakhouse-preview-git-feature-v8-system-miomika-s-projects.vercel.app";

const jobs = [
  { path: "/", form: "mobile", out: ".lh-v8f-home-m.json" },
  { path: "/", form: "desktop", out: ".lh-v8f-home-d.json" },
  { path: "/rooms", form: "mobile", out: ".lh-v8f-rooms-m.json" },
  { path: "/rooms", form: "desktop", out: ".lh-v8f-rooms-d.json" },
  { path: "/rooms/river-loft", form: "mobile", out: ".lh-v8f-room-m.json" },
  { path: "/rooms/river-loft", form: "desktop", out: ".lh-v8f-room-d.json" },
  { path: "/owner", form: "desktop", out: ".lh-v8f-owner-d.json" },
];

function score(out) {
  const r = JSON.parse(fs.readFileSync(out, "utf8"));
  const s = Math.round(r.categories.performance.score * 100);
  const a = r.audits;
  return {
    perf: s,
    lcp: a["largest-contentful-paint"].displayValue,
    cls: a["cumulative-layout-shift"].displayValue,
    tbt: a["total-blocking-time"].displayValue,
  };
}

for (const job of jobs) {
  const url = base + job.path;
  console.log(`=== LH ${job.form} ${job.path} ===`);
  const args = [
    "lighthouse",
    url,
    "--only-categories=performance",
    `--form-factor=${job.form}`,
    "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
    "--output=json",
    `--output-path=${job.out}`,
    "--quiet",
  ];
  if (job.form === "desktop") args.push("--preset=desktop");
  try {
    execFileSync("npx", ["--yes", ...args], {
      stdio: "inherit",
      shell: true,
      cwd: __dirname + "/..",
    });
  } catch (_) {
    /* chrome cleanup noise */
  }
  if (!fs.existsSync(job.out)) {
    console.log("no report");
    continue;
  }
  const s = score(job.out);
  console.log(`P=${s.perf} LCP=${s.lcp} CLS=${s.cls} TBT=${s.tbt}`);
}
