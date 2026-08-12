const https = require("https");
const fs = require("fs");

const base =
  "https://teakhouse-preview-git-feature-v8-system-miomika-s-projects.vercel.app";

const jobs = [
  { path: "/", strategy: "mobile" },
  { path: "/", strategy: "desktop" },
  { path: "/rooms", strategy: "mobile" },
  { path: "/rooms", strategy: "desktop" },
  { path: "/rooms/river-loft", strategy: "mobile" },
  { path: "/rooms/river-loft", strategy: "desktop" },
  { path: "/owner", strategy: "desktop" },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function run() {
  const rows = ["path,strategy,perf,lcp,cls,tbt"];
  for (const job of jobs) {
    const pageUrl = base + job.path;
    const api =
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" +
      encodeURIComponent(pageUrl) +
      "&strategy=" +
      job.strategy +
      "&category=performance";
    process.stdout.write(`=== PSI ${job.strategy} ${job.path} ===\n`);
    try {
      const r = await fetchJson(api);
      if (r.error) {
        process.stdout.write(`FAIL: ${r.error.message}\n`);
        continue;
      }
      const lh = r.lighthouseResult;
      const perf = Math.round(lh.categories.performance.score * 100);
      const lcp = lh.audits["largest-contentful-paint"].displayValue;
      const cls = lh.audits["cumulative-layout-shift"].displayValue;
      const tbt = lh.audits["total-blocking-time"].displayValue;
      process.stdout.write(`P=${perf} LCP=${lcp} CLS=${cls} TBT=${tbt}\n`);
      rows.push(
        `${job.path},${job.strategy},${perf},${lcp.replace(/,/g, "")},${cls},${tbt.replace(/,/g, "")}`
      );
    } catch (e) {
      process.stdout.write(`FAIL: ${e.message}\n`);
    }
  }
  fs.writeFileSync(".psi-v8-results.csv", rows.join("\n") + "\n");
}

run();
