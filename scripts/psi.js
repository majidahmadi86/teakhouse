/**
 * PageSpeed Insights · authoritative, third-party performance numbers.
 *
 * Local Lighthouse on a dev machine measures the dev machine · the same build
 * scored 56 and 67 within an hour here. These numbers get quoted to clients, so
 * they have to come from Google's own infrastructure, where the throttling is
 * fixed and the result is independently reproducible by anyone with the URL.
 *
 * Prints a markdown table plus, for every row, the pagespeed.web.dev URL that
 * re-runs exactly that measurement · that link is the verification.
 *
 *   node scripts/psi.js
 *   node scripts/psi.js --json out.json
 *   PSI_KEY=... node scripts/psi.js      (optional · raises the rate limit)
 */

const fs = require("fs");

const BASE = process.env.PSI_BASE || "https://teakhouse.mikaro.studio";
const ROUTES = ["/", "/rooms", "/rooms/river-loft", "/book", "/dining"];
const STRATEGIES = ["mobile", "desktop"];

/** The public analysis page for a URL · click it and PSI measures again. */
function reportUrl(url, strategy) {
  return `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(
    url
  )}&form_factor=${strategy}`;
}

function apiUrl(url, strategy) {
  const key = process.env.PSI_KEY ? `&key=${process.env.PSI_KEY}` : "";
  return (
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
    `?url=${encodeURIComponent(url)}&strategy=${strategy}` +
    `&category=performance${key}`
  );
}

const ms = (n) => (n == null ? null : Math.round(n));

async function measure(route, strategy, attempt = 1) {
  const url = BASE + route;
  const res = await fetch(apiUrl(url, strategy));
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // 429 and 500 from PSI are transient · it is a shared public quota.
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const waitMs = 15000 * attempt;
      console.log(`   ${res.status} · retrying in ${waitMs / 1000}s`);
      await new Promise((r) => setTimeout(r, waitMs));
      return measure(route, strategy, attempt + 1);
    }
    throw new Error(`PSI ${res.status} for ${route} ${strategy} · ${body.slice(0, 160)}`);
  }
  const j = await res.json();
  const lh = j.lighthouseResult;
  const a = lh.audits;
  return {
    route,
    strategy,
    score: Math.round(lh.categories.performance.score * 100),
    lcp: ms(a["largest-contentful-paint"].numericValue),
    fcp: ms(a["first-contentful-paint"].numericValue),
    tbt: ms(a["total-blocking-time"].numericValue),
    cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
    si: ms(a["speed-index"].numericValue),
    bytesKb: Math.round((a["total-byte-weight"]?.numericValue || 0) / 1024),
    lhVersion: lh.lighthouseVersion,
    when: lh.fetchTime,
    report: reportUrl(url, strategy),
    // The biggest opportunities, so a bad score comes with its own diagnosis.
    top: Object.values(a)
      .filter((x) => x.details?.type === "opportunity" && x.numericValue > 100)
      .sort((x, y) => y.numericValue - x.numericValue)
      .slice(0, 3)
      .map((x) => `${x.id} ${Math.round(x.numericValue)}ms`),
  };
}

async function main() {
  const rows = [];
  for (const strategy of STRATEGIES) {
    for (const route of ROUTES) {
      process.stdout.write(`PSI ${strategy.padEnd(7)} ${route} … `);
      try {
        const r = await measure(route, strategy);
        rows.push(r);
        console.log(
          `${r.score}  LCP ${r.lcp}ms  TBT ${r.tbt}ms  CLS ${r.cls}  ${r.bytesKb}KB`
        );
      } catch (e) {
        console.log("FAILED · " + (e.message || e));
        rows.push({ route, strategy, score: null, error: String(e.message || e) });
      }
      // Be a good citizen of a public quota.
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  console.log("\n| Route | Device | Score | LCP | TBT | CLS | Weight |");
  console.log("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| \`${r.route}\` | ${r.strategy} | ${r.score ?? "ERR"} | ${r.lcp ?? "-"}ms | ${
        r.tbt ?? "-"
      }ms | ${r.cls ?? "-"} | ${r.bytesKb ?? "-"}KB |`
    );
  }

  console.log("\nVerify (each link re-measures):");
  for (const r of rows) console.log(`${r.strategy.padEnd(7)} ${r.route.padEnd(18)} ${r.report}`);

  const homeM = rows.find((r) => r.route === "/" && r.strategy === "mobile");
  if (homeM?.score != null) {
    console.log(
      `\nhome mobile ${homeM.score} · ${homeM.score >= 94 ? "AT OR ABOVE 94" : "BELOW 94"}`
    );
    if (homeM.top?.length) console.log("opportunities · " + homeM.top.join(" · "));
  }

  const jsonAt = process.argv.indexOf("--json");
  if (jsonAt > -1 && process.argv[jsonAt + 1]) {
    fs.writeFileSync(process.argv[jsonAt + 1], JSON.stringify(rows, null, 2));
    console.log(`\nwrote ${process.argv[jsonAt + 1]}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
