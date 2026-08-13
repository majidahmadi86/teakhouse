/**
 * Why is one route slow, according to PSI itself.
 *
 * scripts/psi.js gives the score; this gives the reason. Prints the LCP element,
 * the four LCP phases (which is the only honest way to know whether to attack
 * the server, the image, or the JS), and every audit with real savings.
 *
 *   PSI_KEY=... node scripts/psi-diagnose.js /            mobile
 *   PSI_KEY=... node scripts/psi-diagnose.js /dining      desktop
 */

const BASE = process.env.PSI_BASE || "https://teakhouse.mikaro.studio";
const route = process.argv[2] || "/";
const strategy = process.argv[3] || "mobile";

async function main() {
  const key = process.env.PSI_KEY ? `&key=${process.env.PSI_KEY}` : "";
  const url =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
    `?url=${encodeURIComponent(BASE + route)}&strategy=${strategy}` +
    `&category=performance${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PSI ${res.status} · ${(await res.text()).slice(0, 200)}`);
  const { lighthouseResult: lh } = await res.json();
  const a = lh.audits;

  console.log(`${BASE}${route} · ${strategy} · score ${Math.round(lh.categories.performance.score * 100)}`);
  console.log(
    `FCP ${a["first-contentful-paint"].displayValue} · LCP ${a["largest-contentful-paint"].displayValue} · ` +
      `TBT ${a["total-blocking-time"].displayValue} · CLS ${a["cumulative-layout-shift"].displayValue} · ` +
      `SI ${a["speed-index"].displayValue}`
  );

  // Metric score, not raw value · the score is what moves the number.
  console.log("\nmetric scores (these are what the 0-100 is made of):");
  for (const id of [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
  ]) {
    console.log(`  ${id.padEnd(28)} ${Math.round((a[id].score ?? 0) * 100)}`);
  }

  const el = a["largest-contentful-paint-element"];
  if (el?.details?.items?.length) {
    console.log("\nLCP element + phases:");
    for (const item of el.details.items) {
      if (item.items) {
        for (const sub of item.items) {
          const label = sub.node?.snippet || sub.phase || sub.url || "";
          const val = sub.timing != null ? `${Math.round(sub.timing)}ms` : sub.percent || "";
          console.log(`  ${String(label).slice(0, 92)}  ${val}`);
        }
      }
    }
  }

  console.log("\nopportunities and diagnostics with savings:");
  const rows = Object.values(a)
    .filter((x) => {
      const ms = x.details?.overallSavingsMs ?? x.numericValue;
      return (
        x.score !== null &&
        x.score < 0.95 &&
        (x.details?.type === "opportunity" || x.details?.type === "table") &&
        typeof ms === "number" &&
        ms > 50
      );
    })
    .sort(
      (x, y) =>
        (y.details?.overallSavingsMs ?? y.numericValue) -
        (x.details?.overallSavingsMs ?? x.numericValue)
    );
  for (const r of rows.slice(0, 12)) {
    const ms = Math.round(r.details?.overallSavingsMs ?? r.numericValue);
    const bytes = r.details?.overallSavingsBytes
      ? ` · ${Math.round(r.details.overallSavingsBytes / 1024)}KB`
      : "";
    console.log(`  ${r.id.padEnd(34)} ${String(ms).padStart(6)}ms${bytes}`);
  }

  // The heaviest requests · usually the real story behind a slow LCP.
  const items = a["network-requests"]?.details?.items ?? [];
  const heavy = items
    .filter((i) => (i.transferSize ?? 0) > 25000)
    .sort((x, y) => y.transferSize - x.transferSize)
    .slice(0, 10);
  if (heavy.length) {
    console.log("\nheaviest requests:");
    for (const h of heavy) {
      console.log(
        `  ${String(Math.round(h.transferSize / 1024)).padStart(5)}KB  ${h.resourceType ?? ""}  ${String(
          h.url
        ).replace(BASE, "").slice(0, 78)}`
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
