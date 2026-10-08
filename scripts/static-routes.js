/**
 * Static-routes gate · every guest route is static (○) or ISR/SSG (●), never
 * dynamic (ƒ). API routes and the owner panel are exempt (they are meant to
 * render per request).
 *
 * Runs `next build` (prisma generate first, exactly like `npm run build`),
 * reads the route table Next prints, and fails when:
 *   · a guest route is ƒ (Dynamic), or has a symbol it cannot classify
 *   · an expected guest route is missing from the table (so the gate can
 *     never pass by matching nothing)
 *
 *   node scripts/static-routes.js            # build, then check
 *   node scripts/static-routes.js --log x    # check an existing build log
 *
 * Stop any `next start` on this repo first (Windows locks .next files).
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/** Every public guest route and the internal route that renders it. */
const EXPECTED = {
  "/": "/[lang]",
  "/rooms": "/[lang]/rooms",
  "/rooms/<slug>": "/[lang]/rooms/[slug]",
  "/book?in&out&g&room": "/[lang]/book/[...stay]",
  "/dining": "/[lang]/dining",
  "/dining/reserve": "/[lang]/dining/reserve",
  "/dining/reserve?ref...": "/[lang]/dining/reserve/q/[q]",
  "/events": "/[lang]/events",
  "/events/reserve": "/[lang]/events/reserve",
  "/events/reserve?ref...": "/[lang]/events/reserve/q/[q]",
  "/experience": "/[lang]/experience",
  "/facilities": "/[lang]/facilities",
  "/gallery": "/[lang]/gallery",
  "/offers": "/[lang]/offers",
  "/location": "/[lang]/location",
  "/contact": "/[lang]/contact",
  "/contact?about...": "/[lang]/contact/q/[q]",
  "/account": "/[lang]/account",
  "/account/signin": "/[lang]/account/signin",
  "/account/signup": "/[lang]/account/signup",
};

function build() {
  const run = (cmd, args) => {
    const r = spawnSync(cmd, args, {
      cwd: ROOT,
      encoding: "utf8",
      shell: process.platform === "win32",
      maxBuffer: 64 * 1024 * 1024,
    });
    return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
  };
  const gen = run("npx", ["prisma", "generate"]);
  if (gen.code !== 0) {
    console.error(gen.out);
    throw new Error("prisma generate failed");
  }
  const b = run("npx", ["next", "build"]);
  if (b.code !== 0) {
    console.error(b.out.slice(-4000));
    throw new Error("next build failed");
  }
  return b.out;
}

function parse(log) {
  const routes = [];
  // "├ ● /[lang]/rooms     1.3 kB   111 kB" · the route column of Next's table.
  const re = /^[┌├└│ ]\s*([○●ƒλ◐])\s+(\/\S*)/u;
  for (const raw of log.split(/\r?\n/)) {
    const line = raw.replace(/\x1b\[[0-9;]*m/g, "");
    const m = re.exec(line);
    if (m) routes.push({ symbol: m[1], route: m[2] });
  }
  return routes;
}

function main() {
  const i = process.argv.indexOf("--log");
  const log = i > 0 ? fs.readFileSync(process.argv[i + 1], "utf8") : build();
  const routes = parse(log);
  if (!routes.length) throw new Error("no route table found in the build output");

  const exempt = (r) => r.startsWith("/api/") || r === "/api" || r === "/owner" || r.startsWith("/owner/");
  let failures = 0;
  const report = [];

  for (const { symbol, route } of routes) {
    if (exempt(route)) continue;
    const ok = symbol === "○" || symbol === "●";
    if (!ok) failures++;
    report.push(`${ok ? "PASS" : "FAIL"} · ${symbol} ${route}${ok ? "" : " · guest route renders per request"}`);
  }

  const seen = new Set(routes.map((r) => r.route));
  for (const [pub, internal] of Object.entries(EXPECTED)) {
    const present = seen.has(internal);
    if (!present) failures++;
    report.push(`${present ? "PASS" : "FAIL"} · ${pub} is served by ${internal}${present ? "" : " · MISSING from the build"}`);
  }

  const counted = routes.filter((r) => !exempt(r.route));
  console.log(report.join("\n"));
  console.log(
    `\n${counted.length} guest routes in the table: ${counted.filter((r) => r.symbol === "○").length} static (○), ${counted.filter((r) => r.symbol === "●").length} SSG/ISR (●), ${counted.filter((r) => r.symbol === "ƒ" || r.symbol === "λ").length} dynamic (ƒ)`
  );
  console.log(failures ? `\nFAILED · ${failures} problem(s)` : "\nALL GUEST ROUTES STATIC OR ISR");
  if (failures) process.exitCode = 1;
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
}
