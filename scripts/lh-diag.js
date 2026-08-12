const path = require("path");
const r = require(path.join(__dirname, "..", ".lh-gate-home-m-2.json"));
const a = r.audits;
console.log("perf", Math.round(r.categories.performance.score * 100));
console.log("LCP", a["largest-contentful-paint"].displayValue);
console.log("TBT", a["total-blocking-time"].displayValue);
console.log("FCP", a["first-contentful-paint"].displayValue);
console.log("SI", a["speed-index"].displayValue);
const el = a["largest-contentful-paint-element"];
console.log("LCP element audit", el ? el.displayValue : "missing");
if (el?.details?.items) console.log(JSON.stringify(el.details.items, null, 2).slice(0, 1500));
console.log("---boot---");
for (const i of a["bootup-time"]?.details?.items || []) {
  console.log(Math.round(i.total) + "ms", (i.url || "").slice(-80));
}
console.log("---rb---");
for (const i of a["render-blocking-resources"]?.details?.items || []) {
  console.log(i.wastedMs, (i.url || "").slice(-70));
}
console.log("---fonts/imgs---");
for (const i of a["network-requests"]?.details?.items || []) {
  const u = i.url || "";
  if (/avif|hero|woff|font|css/.test(u)) {
    console.log(
      Math.round((i.resourceSize || 0) / 1024) + "KB",
      Math.round(i.networkEndTime || 0) + "ms",
      u.slice(-60)
    );
  }
}
