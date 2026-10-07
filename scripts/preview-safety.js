#!/usr/bin/env node
/**
 * v17 · PREVIEW SAFETY gate for Teak House.
 *
 * Proves, against the LOCAL dev database only (localhost:55432), that
 *   a) static · no build step migrates or seeds, and every write path is guarded;
 *   b) unit    · with VERCEL_ENV=preview the real lib/db refuses every write
 *                (model ops, raw SQL, interactive and batch transactions) and
 *                a full database fingerprint is identical before and after;
 *   c) runtime · a preview build (`prisma generate && next build` with
 *                VERCEL_ENV=preview) served by `next start -p 3021` writes
 *                nothing when every API write handler, every GET writer, the
 *                demo reset and the three guest server-action forms are hit,
 *                while the guest pages still answer 200; the same build is
 *                still read-only with VERCEL_ENV absent at runtime (baked);
 *   d) restore · rebuilds normally so .next is a regular build again, and
 *                checks that build is writable (validation runs, no 403).
 *
 * Usage (from the repo root):
 *   node scripts/preview-safety.js              full gate (about 10 minutes)
 *   node scripts/preview-safety.js --no-runtime static + unit only
 *   node scripts/preview-safety.js --no-restore skip the final normal rebuild
 *
 * It only ever talks to the dev DB named in .env.local / .env and refuses to
 * run if that is not localhost:55432. Supabase, email and AI env vars are
 * replaced with unreachable or empty values for every child process, so
 * nothing can leave the machine. It never stops the dev DB processes.
 * The fingerprint helper sets DemoMeta.lastReset an hour and a half into the
 * past (so an unguarded GET /api/data WOULD reseed) and restores it at the end.
 */
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PORT = 3021;
const BASE = `http://localhost:${PORT}`;
const DEV_DB_PORT = 55432;
const OTHER_DEV_DB_PORT = 55433; // Sovra's dev DB · must stay up too
const LOG_DIR = path.join(os.tmpdir(), "teakhouse-preview-safety");
const READ_ONLY_CODE = "READ_ONLY_DEPLOYMENT";
const QA_NAME = "QA_PreviewSafety"; // scripts/lib/qa.js prefix, in case
const PLAYWRIGHT_CANDIDATES = [
  "D:/WorkSpace/projects/customers/sovra/node_modules/playwright",
  path.join(ROOT, "node_modules", "playwright"),
];

const args = new Set(process.argv.slice(2));
const RUNTIME = !args.has("--no-runtime");
const RESTORE = !args.has("--no-restore");

fs.mkdirSync(LOG_DIR, { recursive: true });

/* ------------------------------------------------------------------------ */
/* Reporting                                                                 */
/* ------------------------------------------------------------------------ */

let passed = 0;
let failed = 0;
function result(ok, section, label, detail = "") {
  if (ok) passed++;
  else failed++;
  const tag = ok ? "PASS" : "FAIL";
  // Details explain a failure; on a pass they are noise.
  console.log(`${tag}  ${section.padEnd(7)} ${label}${!ok && detail ? ` :: ${detail}` : ""}`);
}
const info = (msg) => console.log(`      ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------------ */
/* Dev DB and child env                                                      */
/* ------------------------------------------------------------------------ */

function readEnvVar(file, key) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  return null;
}

/** Next's precedence: .env.local beats .env. Never printed. */
function devDbUrl() {
  const raw = readEnvVar(".env.local", "DATABASE_URL") || readEnvVar(".env", "DATABASE_URL");
  if (!raw) throw new Error("no DATABASE_URL in .env.local or .env");
  const u = new URL(raw);
  const local = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(u.hostname);
  if (!local || u.port !== String(DEV_DB_PORT)) {
    throw new Error(`refusing to run: DATABASE_URL is ${u.hostname}:${u.port}, not the local dev DB on ${DEV_DB_PORT}`);
  }
  return raw;
}

const DEV_DB = devDbUrl();

/** Env for every child: dev DB only; outbound services pointed nowhere. */
function childEnv(extra = {}) {
  const env = { ...process.env };
  for (const k of ["VERCEL_ENV", "DB_READ_ONLY", "CRON_SECRET", "VERCEL", "VERCEL_URL"]) delete env[k];
  Object.assign(env, {
    DATABASE_URL: DEV_DB,
    DIRECT_URL: DEV_DB,
    NEXT_TELEMETRY_DISABLED: "1",
    DEMO_MODE: "true",
    // Port 9 (discard) on loopback: an unguarded upload would fail locally.
    SUPABASE_URL: "http://127.0.0.1:9",
    SUPABASE_SERVICE_ROLE_KEY: "qa-preview-safety-not-a-key",
    EMAIL_PROVIDER: "",
    AI_PROVIDER: "",
    AI_MODEL: "",
    OPENAI_API_KEY: "",
    GROQ_API_KEY: "",
    ANTHROPIC_API_KEY: "",
  });
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  return env;
}

function db(cmd, arg) {
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, "lib", "preview-safety-db.js"), cmd, ...(arg ? [arg] : [])], {
    cwd: ROOT,
    env: childEnv(),
    encoding: "utf8",
    timeout: 120000,
  });
  if (r.status !== 0) throw new Error(`db helper ${cmd} failed: ${(r.stderr || "").slice(0, 300)}`);
  return JSON.parse(r.stdout);
}

/** Wait out the stats flush, then fingerprint. */
async function fingerprint() {
  await sleep(1500);
  return db("fingerprint");
}

function fpDiff(a, b) {
  const out = [];
  for (const part of ["rows", "sequences", "writeCounters"]) {
    const keys = new Set([...Object.keys(a[part]), ...Object.keys(b[part])]);
    for (const k of keys) {
      if (a[part][k] !== b[part][k]) out.push(`${part}.${k}: ${a[part][k]} -> ${b[part][k]}`);
    }
  }
  return out;
}

function compare(section, label, a, b) {
  const d = fpDiff(a, b);
  result(d.length === 0, section, `${label} (${a.tableCount} tables: rows+md5, sequences, write counters)`, d.slice(0, 6).join(" | "));
}

/* ------------------------------------------------------------------------ */
/* Processes                                                                 */
/* ------------------------------------------------------------------------ */

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.once("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.once("error", () => resolve(false));
    s.setTimeout(1500, () => {
      s.destroy();
      resolve(false);
    });
  });
}

function runLogged(name, command, env) {
  const log = path.join(LOG_DIR, `${name}.log`);
  const t0 = Date.now();
  const r = cp.spawnSync(command, { cwd: ROOT, env, shell: true, encoding: "utf8", timeout: 20 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  fs.writeFileSync(log, `${r.stdout || ""}\n${r.stderr || ""}`);
  const secs = Math.round((Date.now() - t0) / 1000);
  const tail = `${r.stdout || ""}\n${r.stderr || ""}`.trim().split(/\r?\n/).slice(-8).join(" / ");
  return { ok: r.status === 0, status: r.status, secs, log, tail };
}

/** `next start -p 3021` through the next bin, so the PID is the server. */
async function startServer(name, env) {
  if (await portOpen(PORT)) throw new Error(`port ${PORT} is already in use; not touching whatever runs there`);
  const logPath = path.join(LOG_DIR, `${name}.log`);
  const fd = fs.openSync(logPath, "w");
  const child = cp.spawn(process.execPath, [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", fd, fd],
    windowsHide: true,
  });
  let exited = null;
  child.on("exit", (code) => (exited = code));
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (exited !== null) throw new Error(`server exited early (code ${exited}); see ${logPath}`);
    try {
      const r = await fetch(`${BASE}/api/media`, { signal: AbortSignal.timeout(5000) });
      if (r.status === 200) return { child, logPath };
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  await stopServer({ child });
  throw new Error(`server did not answer within 120 s; see ${logPath}`);
}

/** Kill exactly the PID we started (and its children). Never the dev DBs. */
async function stopServer(srv) {
  if (!srv || !srv.child) return;
  const pid = srv.child.pid;
  if (process.platform === "win32") {
    cp.spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8" });
  } else {
    srv.child.kill("SIGTERM");
  }
  for (let i = 0; i < 40 && (await portOpen(PORT)); i++) await sleep(500);
  await sleep(1000);
}

async function devDbsUp(section) {
  const a = await portOpen(DEV_DB_PORT);
  const b = await portOpen(OTHER_DEV_DB_PORT);
  result(a && b, section, `dev DB listeners still up (${DEV_DB_PORT}: ${a}, ${OTHER_DEV_DB_PORT}: ${b})`);
}

/* ------------------------------------------------------------------------ */
/* a) Static                                                                 */
/* ------------------------------------------------------------------------ */

const FORBIDDEN_BUILD = /\b(migrate|db\s+push|db\s+seed|seed|reset|bootstrap|db:)/i;

function walk(dir, pred, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      walk(p, pred, out);
    } else if (pred(p)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

/** Body of `export async function NAME(` up to the next top-level export. */
function handlerBody(src, method) {
  const re = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`);
  const m = re.exec(src);
  if (!m) return null;
  const rest = src.slice(m.index);
  const next = rest.slice(1).search(/\n(export\s|function\s|async\s+function\s)/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

function apiRoutes() {
  const files = walk(path.join(ROOT, "app", "api"), (p) => /[\\/]route\.(ts|js)$/.test(p));
  return files
    .map((f) => {
      const src = fs.readFileSync(f, "utf8");
      const url =
        "/" +
        rel(path.dirname(f))
          .replace(/^app\//, "")
          .split("/")
          .filter((s) => !/^\(.*\)$/.test(s))
          .join("/");
      const methods = new Set();
      for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) methods.add(m[1]);
      for (const m of src.matchAll(/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g)) methods.add(m[1]);
      return { file: rel(f), url, src, methods: [...methods].sort() };
    })
    .sort((a, b) => a.url.localeCompare(b.url));
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
/** Write-method handlers that only read, by design. */
const READ_ONLY_BY_DESIGN = {
  "POST /api/concierge": "chat over live rows, no writes",
  // HF-1 · the owner session is a signed cookie: no table, no outbound call.
  "POST /api/owner/session": "issues a signed session cookie, no DB write",
  "DELETE /api/owner/session": "clears the session cookie, no DB write",
};
const PRISMA_WRITE = /\.(create|createMany|createManyAndReturn|update|updateMany|upsert|delete|deleteMany)\s*\(|\$executeRaw/;

function staticChecks() {
  const S = "static";
  const pkg = JSON.parse(read("package.json"));
  const scripts = pkg.scripts || {};
  result(scripts.build === "prisma generate && next build", S, 'package.json build is exactly "prisma generate && next build"', `got ${JSON.stringify(scripts.build)}`);
  const hooks = ["preinstall", "install", "postinstall", "prepare", "prepublish", "preprepare", "postprepare", "prebuild", "postbuild", "vercel-build", "prestart", "poststart"];
  const present = hooks.filter((h) => scripts[h] !== undefined);
  result(present.length === 0, S, "no install/build lifecycle hooks (pre/postinstall, prepare, pre/postbuild, vercel-build)", present.join(", "));
  // Everything a Vercel build runs: install hooks (none, above) + build.
  const reach = [scripts.build || ""].concat(present.map((h) => scripts[h]));
  const bad = reach.filter((s) => FORBIDDEN_BUILD.test(s));
  result(bad.length === 0, S, "no migrate/seed/reset/bootstrap reachable from the build script", bad.join(" | "));

  const vercel = fs.existsSync(path.join(ROOT, "vercel.json")) ? JSON.parse(read("vercel.json")) : {};
  const overrides = ["buildCommand", "installCommand", "devCommand", "framework", "outputDirectory"].filter((k) => vercel[k] !== undefined);
  result(overrides.length === 0, S, "vercel.json sets no build/install command override", overrides.join(", "));
  const crons = (vercel.crons || []).map((c) => c.path);
  result(crons.every((p) => p === "/api/cron/reseed"), S, "vercel.json crons: only /api/cron/reseed (guarded below)", crons.join(", "));

  const hooksDirs = [".github/workflows", ".husky"].filter((d) => fs.existsSync(path.join(ROOT, d)));
  result(hooksDirs.length === 0, S, "no CI workflow or git hook directory that could migrate", hooksDirs.join(", "));
  const instr = ["instrumentation.ts", "instrumentation.js", "src/instrumentation.ts"].filter((f) => fs.existsSync(path.join(ROOT, f)));
  result(instr.length === 0, S, "no instrumentation.ts (nothing runs at server start)", instr.join(", "));
  result(!fs.existsSync(path.join(ROOT, "scripts", "bootstrap-db.mjs")), S, "no bootstrap-db script in Teak House (Sovra-only concern)");

  const nextCfg = read("next.config.mjs");
  const bakes =
    /writePolicy\(process\.env\)\.writable\s*\?\s*"0"\s*:\s*"1"/.test(nextCfg) && /env:\s*\{[\s\S]*?DB_READ_ONLY/.test(nextCfg);
  result(bakes, S, 'next.config.mjs bakes DB_READ_ONLY as "1" or "0" (never empty) from lib/writePolicy.mjs');
  result(/if\s*\(process\.env\.VERCEL\s*&&\s*!process\.env\.VERCEL_ENV\)\s*\{\s*throw/.test(nextCfg), S, "next.config.mjs throws when VERCEL is set without VERCEL_ENV");
  const roSrc = read("lib/readOnly.ts");
  result(
    /if \(process\.env\.DB_READ_ONLY === "1"\) return true;\s*\r?\n(\s*\/\/[^\n]*\r?\n)*\s*return !writePolicy\(process\.env\)\.writable;/.test(roSrc),
    S,
    "isReadOnlyDeployment() checks the baked constant AND the runtime rule"
  );

  const appFiles = [
    ...walk(path.join(ROOT, "app"), (p) => /\.(ts|tsx|js|mjs)$/.test(p)),
    ...walk(path.join(ROOT, "lib"), (p) => /\.(ts|tsx|js|mjs)$/.test(p)),
    ...walk(path.join(ROOT, "components"), (p) => /\.(ts|tsx|js|mjs)$/.test(p)),
    ...walk(path.join(ROOT, "config"), (p) => /\.(ts|tsx|js|mjs)$/.test(p)),
    path.join(ROOT, "middleware.ts"),
  ].filter((p) => fs.existsSync(p));
  const prismaNew = appFiles.filter((f) => /new\s+PrismaClient\s*\(/.test(fs.readFileSync(f, "utf8"))).map(rel);
  result(prismaNew.length === 1 && prismaNew[0] === "lib/db.ts", S, "lib/db.ts is the only PrismaClient in app code", prismaNew.join(", "));
  const otherClients = appFiles
    .filter((f) => /from\s+["'](pg|postgres|@supabase\/[^"']+|stripe|mysql2?|@vercel\/postgres)["']/.test(fs.readFileSync(f, "utf8")))
    .map(rel);
  result(otherClients.length === 0, S, "no other DB, Supabase SDK or payment client in app code", otherClients.join(", "));
  const storageRest = appFiles.filter((f) => /\/storage\/v1/.test(fs.readFileSync(f, "utf8"))).map(rel);
  result(storageRest.length === 1 && storageRest[0] === "lib/storage.ts", S, "Supabase Storage REST is called from lib/storage.ts only", storageRest.join(", "));

  const dbSrc = read("lib/db.ts");
  result(/\$extends\(/.test(dbSrc) && /isReadOnlyDeployment\(\)\s*\?\s*readOnlyClient/.test(dbSrc), S, "lib/db.ts wraps the client in the read-only extension when read-only");
  result(
    /return Boolean\(model\) && READ_MODEL_OPS\.has\(operation\);/.test(dbSrc) && !/isReadOnlySql|rawSqlText/.test(dbSrc + read("lib/readOnly.ts")),
    S,
    "the guard is a model-read allowlist: no raw SQL classifier, every raw or unknown operation refused"
  );

  // Every write handler refuses first.
  const missing = [];
  let guarded = 0;
  for (const r of apiRoutes()) {
    for (const m of r.methods.filter((x) => WRITE_METHODS.has(x))) {
      const key = `${m} ${r.url}`;
      const body = handlerBody(r.src, m) || "";
      if (READ_ONLY_BY_DESIGN[key]) {
        if (PRISMA_WRITE.test(body) || PRISMA_WRITE.test(r.src)) missing.push(`${key} (allowlisted but writes)`);
        continue;
      }
      if (key === "POST /api/users") {
        if (!/action\s*!==\s*"signin"[\s\S]{0,120}readOnlyResponse\(\)/.test(body)) missing.push(key);
        else guarded++;
        continue;
      }
      const firstLine = body.split(/\r?\n/).slice(1).find((l) => l.trim()) || "";
      if (!/const ro = readOnlyResponse\(\);/.test(firstLine)) missing.push(key);
      else guarded++;
    }
  }
  result(missing.length === 0, S, `every API write handler refuses first in read-only mode (${guarded} guarded; concierge and owner session write no rows)`, missing.join(", "));

  const cron = read("app/api/cron/reseed/route.ts");
  const cronGet = handlerBody(cron, "GET") || "";
  const cronFirst = cronGet.split(/\r?\n/).slice(1).find((l) => l.trim() && !l.trim().startsWith("//")) || "";
  result(/const ro = readOnlyResponse\(\);/.test(cronFirst), S, "GET /api/cron/reseed refuses before auth and before any work");

  // HF-1 removed every reseed from request paths: only the cron and the reset
  // route (both refuse first, above) may reach seedDatabase.
  const seedCallers = appFiles
    .filter((f) => /from\s+["']@\/lib\/seedDatabase["']/.test(fs.readFileSync(f, "utf8")))
    .map(rel)
    .sort();
  const wantCallers = ["app/api/cron/reseed/route.ts", "app/api/data/reset/route.ts"];
  result(JSON.stringify(seedCallers) === JSON.stringify(wantCallers), S, "only the cron and POST /api/data/reset import seedDatabase (no reseed on a request path)", seedCallers.join(", "));
  result(!/maybeReseedDemo/.test(read("lib/demoReset.ts")), S, "lib/demoReset.ts has no request-path reseed (maybeReseedDemo is gone)");
  const tplGet = handlerBody(read("app/api/email-template/route.ts"), "GET") || "";
  result(tplGet.length > 0 && !PRISMA_WRITE.test(tplGet) && !/ensureTemplate\(/.test(tplGet), S, "GET /api/email-template does not create the row");

  const checks = [
    ["lib/seedDatabase.ts", /export async function seedDatabase\([^)]*\)\s*\{[\s\S]{0,300}?assertWritable\("seedDatabase"\);\s*\r?\n\s*console\.log/, "seedDatabase() refuses before its transaction opens"],
    ["lib/storage.ts", /export async function uploadMedia[\s\S]{0,400}?isReadOnlyDeployment\(\)/, "uploadMedia() refuses before any Supabase call"],
    ["lib/email.ts", /isReadOnlyDeployment\(\)/, "sendConfirmationEmail() refuses"],
    ["app/(guest)/contact/actions.ts", /if \(isReadOnlyDeployment\(\)\)\s*\{\s*\r?\n\s*redirect\(`\/contact\?about=\$\{purpose\}&error=failed`\)/, "contact action ends on the existing error=failed path"],
    ["lib/reservationService.ts", /if \(isReadOnlyDeployment\(\)\) return \{ ok: false, error: "failed" \};/, "dining reserve ends on the existing error=failed path"],
    ["lib/eventRequestService.ts", /if \(isReadOnlyDeployment\(\)\) return \{ ok: false, error: "failed" \};/, "events reserve ends on the existing error=failed path"],
  ];
  for (const [file, re, label] of checks) result(re.test(read(file)), S, label, file);
}

/* ------------------------------------------------------------------------ */
/* b) Unit                                                                   */
/* ------------------------------------------------------------------------ */

async function unitChecks() {
  const S = "unit";
  const before = await fingerprint();
  info(`dev DB: Postgres ${before.serverVersion}, ${before.tableCount} tables`);
  const r = cp.spawnSync("npx tsx scripts/lib/preview-safety-unit.ts", {
    cwd: ROOT,
    env: childEnv({ VERCEL_ENV: "preview" }),
    shell: true,
    encoding: "utf8",
    timeout: 300000,
  });
  fs.writeFileSync(path.join(LOG_DIR, "unit.log"), `${r.stdout}\n${r.stderr}`);
  let sawTotal = false;
  for (const line of (r.stdout || "").split(/\r?\n/)) {
    const m = line.match(/^(PASS|FAIL)\s+unit\s+(.*)$/);
    if (m) {
      const [label, detail] = m[2].split(" :: ");
      result(m[1] === "PASS", S, label, detail || "");
    }
    if (/^UNIT_TOTAL /.test(line)) sawTotal = true;
  }
  result(sawTotal && r.status === 0, S, "unit process completed cleanly", sawTotal ? "" : `exit ${r.status}; ${(r.stderr || "").slice(0, 300)}`);
  const after = await fingerprint();
  compare(S, "dev DB fingerprint identical before and after the unit run", before, after);
}

/* ------------------------------------------------------------------------ */
/* c) Runtime                                                                */
/* ------------------------------------------------------------------------ */

function hotelIsoPlus(days) {
  // Bangkok is UTC+7 all year.
  const d = new Date(Date.now() + 7 * 3600 * 1000 + days * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

/** Where each [id] segment points, by the segment before it. */
const ID_TABLE = {
  bookings: "Booking",
  contact: "ContactMessage",
  categories: "DiningCategory",
  items: "DiningItem",
  "event-requests": "EventRequest",
  events: "HotelEvent",
  reservations: "TableReservation",
  rooms: "Room",
};

function concreteUrl(pattern, ids) {
  const parts = pattern.split("/");
  return parts
    .map((seg, i) => {
      if (!/^\[.+\]$/.test(seg)) return seg;
      const table = ID_TABLE[parts[i - 1]];
      return encodeURIComponent((table && ids[table]) || "qa-preview-safety-missing-id");
    })
    .join("/");
}

/** Plausible bodies: each one would pass validation and write if unguarded. */
function bodies(ids) {
  const d1 = hotelIsoPlus(20);
  const d2 = hotelIsoPlus(22);
  const name = { en: QA_NAME, th: QA_NAME };
  return {
    "POST /api/blocks": { roomSlug: ids.roomSlug, dateIso: d1 },
    "POST /api/bookings": {
      id: "qa-preview-safety-bk",
      code: "QA-PS01",
      roomSlug: ids.roomSlug,
      guest: QA_NAME,
      email: "qa-preview-safety@example.com",
      phone: "0812345678",
      checkIn: d1,
      checkOut: d2,
      guests: 2,
      amount: 9000,
      deposit: 0,
      status: "confirmed",
      source: "direct",
      notes: QA_NAME,
    },
    "PATCH /api/bookings/[id]": { notes: QA_NAME },
    "POST /api/contact": { purpose: "other", name: QA_NAME, contact: "0812345678", message: "Preview safety gate" },
    "PATCH /api/contact/[id]": { status: "read" },
    "POST /api/dining/categories": { id: "qa-preview-safety-cat", name, order: 99, published: false },
    "PATCH /api/dining/categories/[id]": { published: true, name },
    "POST /api/dining/items": { id: "qa-preview-safety-item", categoryId: ids.DiningCategory, name, description: name, price: 100, order: 99, published: false },
    "PATCH /api/dining/items/[id]": { price: 999 },
    "PATCH /api/email-template": { subject: QA_NAME, body: QA_NAME },
    "POST /api/email-template": { subject: QA_NAME, body: QA_NAME },
    "POST /api/event-requests": { eventId: ids.HotelEvent, name: QA_NAME, contact: "0812345678", contactKind: "phone", guests: 2, notes: "" },
    "PATCH /api/event-requests/[id]": { status: "confirmed" },
    "POST /api/events": { id: "qa-preview-safety-ev", title: name, description: name, date: d1, time: "19:00", price: 0, capacity: 10, published: false },
    "PATCH /api/events/[id]": { published: false },
    "PATCH /api/hotel": { tagline: QA_NAME },
    "POST /api/reservations": { date: d1, time: "19:00", party: 2, name: QA_NAME, contact: "0812345678", contactKind: "phone", notes: "" },
    "PATCH /api/reservations/[id]": { status: "confirmed" },
    "POST /api/rooms": { id: "qa-preview-safety-room", slug: "qa-preview-safety-room", name, rate: 1000, ota: 1200, capacity: 2 },
    "PATCH /api/rooms/[id]": { rate: (ids.roomRate || 1000) + 1 },
    "POST /api/rooms/[id]/pricing": { kind: "season", label: QA_NAME, startDate: d1, endDate: d2, multiplier: 1.1 },
    "PATCH /api/rooms/[id]/pricing": { id: ids.SeasonalPriceRule, multiplier: 1.2 },
    "DELETE /api/rooms/[id]/pricing": { id: ids.SeasonalPriceRule },
  };
}

async function call(method, url, { body, headers = {}, form } = {}) {
  const init = { method, headers: { ...headers }, redirect: "manual", signal: AbortSignal.timeout(60000) };
  if (form) init.body = form;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers["content-type"] = "application/json";
  }
  try {
    const res = await fetch(`${BASE}${url}`, init);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, json, text };
  } catch (e) {
    return { status: 0, json: null, text: String(e && e.message) };
  }
}

const isReadOnly403 = (r) => r.status === 403 && r.json && r.json.code === READ_ONLY_CODE;

const GUEST_PAGES = [
  "/",
  "/rooms",
  "/rooms/[slug]",
  "/book",
  "/account",
  "/account/signin",
  "/account/signup",
  "/contact",
  "/dining",
  "/dining/reserve",
  "/events",
  "/events/reserve",
  "/experience",
  "/facilities",
  "/gallery",
  "/location",
  "/offers",
  "/owner",
];

async function runtimeApiChecks(S, ids) {
  const B = bodies(ids);
  const routes = apiRoutes();
  info(`${routes.length} route files, ${routes.reduce((n, r) => n + r.methods.length, 0)} handlers`);
  for (const r of routes) {
    const url = concreteUrl(r.url, ids);
    for (const m of r.methods) {
      const key = `${m} ${r.url}`;
      if (m === "GET") {
        const res = await call("GET", url);
        if (r.url === "/api/cron/reseed") {
          result(isReadOnly403(res), S, `GET ${r.url} -> 403 read-only`, `got ${res.status} ${res.text.slice(0, 80)}`);
          const auth = await call("GET", url, { headers: { authorization: "Bearer qa-preview-secret" } });
          result(isReadOnly403(auth), S, `GET ${r.url} with the right CRON_SECRET bearer -> still 403 read-only`, `got ${auth.status}`);
        } else if (r.url === "/api/data") {
          const ok = res.status === 200 && res.json && Array.isArray(res.json.rooms) && res.json.rooms.length > 0;
          result(ok, S, `GET ${r.url} -> 200 with data, no reseed (marker is stale)`, `got ${res.status} ${res.text.slice(0, 80)}`);
        } else if (r.url === "/api/email-template") {
          result(res.status === 200 && res.json && typeof res.json.subject === "string", S, `GET ${r.url} -> 200 without creating a row`, `got ${res.status}`);
        } else {
          result(res.status > 0 && res.status < 500, S, `GET ${url} -> ${res.status}`, res.status >= 500 || res.status === 0 ? res.text.slice(0, 120) : "");
        }
        continue;
      }
      if (READ_ONLY_BY_DESIGN[key]) {
        const res =
          r.url === "/api/owner/session"
            ? await call(m, url, { body: m === "POST" ? {} : undefined, headers: { origin: BASE } })
            : await call(m, url, { body: { message: "Do you have a room for two next weekend?", lang: "en" } });
        result(res.status > 0 && res.status < 500 && res.status !== 403, S, `${key} -> ${res.status} (${READ_ONLY_BY_DESIGN[key]})`, res.status >= 500 ? res.text.slice(0, 120) : "");
        continue;
      }
      if (key === "POST /api/users") {
        const actions = [
          ["signup", { action: "signup", name: QA_NAME, email: "qa-preview-safety@example.com", password: "qa-not-a-password" }],
          ["attach", { action: "attach", userId: ids.User, bookingId: ids.Booking }],
          ["update", { action: "update", userId: ids.User, patch: { name: QA_NAME } }],
        ];
        for (const [a, body] of actions) {
          const res = await call(m, url, { body });
          result(isReadOnly403(res), S, `POST /api/users action=${a} -> 403 read-only`, `got ${res.status} ${res.text.slice(0, 80)}`);
        }
        const si = await call(m, url, { body: { action: "signin", email: "nobody-qa@example.com", password: "x" } });
        result(si.status === 401, S, "POST /api/users action=signin still works (read) -> 401 for unknown user", `got ${si.status}`);
        continue;
      }
      if (key === "POST /api/media") {
        const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");
        const form = new FormData();
        form.append("file", new Blob([png], { type: "image/png" }), "qa.png");
        form.append("folder", "qa");
        const res = await call(m, url, { form });
        result(isReadOnly403(res), S, `${key} (multipart PNG) -> 403 read-only, no Supabase upload`, `got ${res.status} ${res.text.slice(0, 80)}`);
        continue;
      }
      let target = url;
      let body = B[key];
      if (key === "DELETE /api/rooms/[id]/pricing" && ids.SeasonalPriceRule) target = `${url}?id=${encodeURIComponent(ids.SeasonalPriceRule)}`;
      if (body === undefined && m !== "DELETE") body = {};
      const res = await call(m, target, { body });
      result(isReadOnly403(res), S, `${m} ${target.replace(/\?.*/, "")} -> 403 read-only`, `got ${res.status} ${res.text.slice(0, 100)}`);
    }
  }

  // GET writers named in the directive that Teak House does not have.
  for (const p of ["/api/reports?cron=1", "/api/channels/sync", `/api/bookings/${encodeURIComponent(ids.Booking || "x")}/identity`]) {
    const res = await call("GET", p);
    result(res.status === 404 || isReadOnly403(res), S, `GET ${p.replace(/\/api\/bookings\/[^/]+/, "/api/bookings/<id>")} -> ${res.status === 404 ? "404 (no such route in Teak House)" : "403 read-only"}`, `got ${res.status}`);
  }
  // The demo reset once more, explicitly.
  const reset = await call("POST", "/api/data/reset");
  result(isReadOnly403(reset), S, "POST /api/data/reset -> 403 read-only (no partial reseed)", `got ${reset.status}`);
}

async function pageChecks(S) {
  // The detail pages are built from the static room list (lib/rooms.ts), not
  // from DB rows, so take the slug from a link the /rooms page really renders.
  const list = await call("GET", "/rooms");
  const all = [...new Set([...list.text.matchAll(/href="\/rooms\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
  info(`/rooms links ${all.length} detail page(s): ${all.join(", ") || "none"}`);
  const linked = all[0];
  const slug = linked || (read("lib/rooms.ts").match(/slug: "([a-z0-9-]+)"/) || [])[1] || "x";
  for (const p of GUEST_PAGES) {
    const url = p.replace("[slug]", encodeURIComponent(slug));
    const res = await call("GET", url);
    result(res.status === 200, S, `page ${url} -> 200 in read-only mode`, `got ${res.status}`);
  }
}

function loadPlaywright() {
  for (const p of PLAYWRIGHT_CANDIDATES) {
    try {
      return require(p);
    } catch {
      /* next */
    }
  }
  return null;
}

async function submitForm(page, S, label, { path: p, fill, okUrl, expect }) {
  const name = `${label} -> calm "Something went wrong" (error=failed), nothing stored`;
  let lastErr = "";
  // One retry, for a slow machine only: the verdict is read from the result
  // page, and the database fingerprint is compared regardless.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(`${BASE}${p}`, { waitUntil: "load", timeout: 60000 });
      // Fields are addressed by name inside the target form only.
      for (const [field, val] of Object.entries(fill || {})) await page.fill(`${expect.form} [name=${field}]`, val);
      await page.click(`${expect.form} button[type=submit]`, { noWaitAfter: true, timeout: 30000 });
      await page.waitForURL(okUrl, { timeout: 60000 });
      await page.waitForLoadState("load").catch(() => {});
      const u = new URL(page.url());
      const err = u.searchParams.get("error");
      const text = await page.textContent("body").catch(() => "");
      const shown = /Something went wrong at our end/.test(text || "");
      const wrote = expect.successParams.some((k) => u.searchParams.get(k));
      result(err === "failed" && shown && !wrote, S, `${name}${attempt > 1 ? " (second attempt)" : ""}`, `url ${u.pathname}${u.search}; message shown: ${shown}`);
      return;
    } catch (e) {
      lastErr = String((e && e.message) || e).split("\n")[0];
    }
  }
  result(false, S, name, `no result page after 2 attempts: ${lastErr}`);
}

async function browserChecks(S, ids) {
  const pw = loadPlaywright();
  if (!pw) {
    result(false, S, "Playwright available (sovra or local node_modules)");
    return;
  }
  const browser = await pw.chromium.launch();
  try {
    for (const js of [true, false]) {
      const ctx = await browser.newContext({ locale: "en-US", javaScriptEnabled: js });
      await ctx.addCookies([{ name: "tkh-lang", value: "en", url: BASE }]);
      const page = await ctx.newPage();
      const mode = js ? "JS" : "no-JS";
      if (js) {
        // The OwnerProvider pages fetch /api/data on mount, as a Lighthouse run would.
        for (const p of ["/book", "/account", "/owner"]) {
          const wait = page.waitForResponse((r) => r.url().includes("/api/data"), { timeout: 30000 }).catch(() => null);
          const nav = await page.goto(`${BASE}${p}`, { waitUntil: "load", timeout: 60000 }).catch((e) => String(e.message).split("\n")[0]);
          const r = await wait;
          result(!!r && r.status() === 200, S, `browser ${p} fetched /api/data -> ${r ? r.status() : "no request"} (stale marker, no reseed)`, typeof nav === "string" ? nav : "");
        }
      }
      await submitForm(page, S, `${mode} contact form`, {
        path: "/contact",
        fill: { name: QA_NAME, contact: "0812345678", message: "Preview safety gate message" },
        okUrl: /[?&](error|sent)=/,
        expect: { form: "form:has(textarea[name=message])", successParams: ["sent"] },
      });
      await submitForm(page, S, `${mode} dining reserve form`, {
        path: "/dining/reserve",
        fill: { date: hotelIsoPlus(10), name: QA_NAME, contact: "0812345678" },
        okUrl: /[?&](error|ref)=/,
        expect: { form: "form:has(input[name=contact])", successParams: ["ref"] },
      });
      if (ids.HotelEvent) {
        await submitForm(page, S, `${mode} events reserve form`, {
          path: `/events/reserve?event=${encodeURIComponent(ids.HotelEvent)}`,
          fill: { name: QA_NAME, contact: "0812345678" },
          okUrl: /[?&](error|ref)=/,
          expect: { form: "form:has(input[name=contact])", successParams: ["ref"] },
        });
      } else {
        result(false, S, `${mode} events reserve form`, "no published HotelEvent in the dev DB to request seats for");
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

async function runtimeChecks() {
  const S = "runtime";
  const fp0 = await fingerprint();

  info("building with VERCEL_ENV=preview (prisma generate && next build)...");
  const previewEnv = childEnv({ VERCEL_ENV: "preview" });
  const gen = runLogged("build-preview-generate", "npx prisma generate", previewEnv);
  const build = gen.ok ? runLogged("build-preview-next", "npx next build", previewEnv) : gen;
  result(gen.ok && build.ok, S, `preview build succeeded (${gen.secs + (gen.ok ? build.secs : 0)} s)`, gen.ok && build.ok ? "" : `${build.tail} (log ${build.log})`);
  if (!(gen.ok && build.ok)) return false;
  const fp1 = await fingerprint();
  compare(S, "the preview build wrote nothing", fp0, fp1);

  // 1 · VERCEL_ENV=preview at runtime, CRON_SECRET set so a right bearer is tried too.
  let srv;
  try {
    srv = await startServer("serve-preview", childEnv({ VERCEL_ENV: "preview", CRON_SECRET: "qa-preview-secret" }));
    result(true, S, `next start -p ${PORT} (VERCEL_ENV=preview) is up, pid ${srv.child.pid}`);
    const ids = db("ids");
    info(`aiming at real rows: room ${ids.roomSlug}, event ${ids.HotelEvent ? "yes" : "none"}, booking ${ids.Booking ? "yes" : "none"}`);
    await runtimeApiChecks(S, ids);
    await pageChecks(S);
    await browserChecks(S, ids);
  } catch (e) {
    result(false, S, "preview server run", String(e && e.message));
  } finally {
    await stopServer(srv);
  }
  await devDbsUp(S);
  const fp2 = await fingerprint();
  compare(S, "dev DB fingerprint identical after every write path was hit", fp0, fp2);

  // 2 · Same build, VERCEL_ENV absent at runtime: the baked constant alone.
  try {
    srv = await startServer("serve-preview-baked", childEnv());
    result(true, S, "same preview build restarted with NO VERCEL_ENV at runtime");
    const reset = await call("POST", "/api/data/reset");
    result(isReadOnly403(reset), S, "baked: POST /api/data/reset -> 403 read-only", `got ${reset.status}`);
    const cron = await call("GET", "/api/cron/reseed");
    result(isReadOnly403(cron), S, "baked: GET /api/cron/reseed -> 403 read-only", `got ${cron.status}`);
    const rsv = await call("POST", "/api/reservations", { body: bodies(db("ids"))["POST /api/reservations"] });
    result(isReadOnly403(rsv), S, "baked: POST /api/reservations -> 403 read-only", `got ${rsv.status}`);
    const data = await call("GET", "/api/data");
    result(data.status === 200, S, "baked: GET /api/data -> 200, no reseed", `got ${data.status}`);
  } catch (e) {
    result(false, S, "baked-constant server run", String(e && e.message));
  } finally {
    await stopServer(srv);
  }
  const fp3 = await fingerprint();
  compare(S, "dev DB fingerprint identical after the baked-constant run", fp0, fp3);
  return true;
}

/* ------------------------------------------------------------------------ */
/* d) Restore a normal build                                                 */
/* ------------------------------------------------------------------------ */

async function restoreBuild() {
  const S = "restore";
  info("rebuilding normally (no VERCEL_ENV) so .next is a regular build again...");
  const env = childEnv();
  const gen = runLogged("build-normal-generate", "npx prisma generate", env);
  const build = gen.ok ? runLogged("build-normal-next", "npx next build", env) : gen;
  result(gen.ok && build.ok, S, `normal build succeeded (${gen.secs + (gen.ok ? build.secs : 0)} s)`, gen.ok && build.ok ? "" : `${build.tail} (log ${build.log})`);
  if (!(gen.ok && build.ok)) return;
  const fp0 = await fingerprint();
  let srv;
  try {
    srv = await startServer("serve-normal", env);
    // An invalid body reaches validation (400) instead of the read-only 403:
    // the normal build is writable, and nothing is written to prove it.
    const r = await call("POST", "/api/reservations", { body: {} });
    result(r.status === 400, S, "normal build is writable: POST /api/reservations {} reaches validation (400, not 403)", `got ${r.status} ${r.text.slice(0, 80)}`);
  } catch (e) {
    result(false, S, "normal server run", String(e && e.message));
  } finally {
    await stopServer(srv);
  }
  await devDbsUp(S);
  const fp1 = await fingerprint();
  compare(S, "dev DB fingerprint identical across the normal-build check", fp0, fp1);
}

/* ------------------------------------------------------------------------ */

async function main() {
  console.log(`preview-safety · Teak House · dev DB localhost:${DEV_DB_PORT} · logs ${LOG_DIR}`);
  staticChecks();

  // Make the demo marker stale so an unguarded reseed path WOULD fire.
  const marker = db("marker-get");
  const stale = new Date(Date.now() - 90 * 60 * 1000).toISOString();
  let restoreMarker = false;
  if (marker.lastReset) {
    const fpA = await fingerprint();
    db("marker-set", stale);
    restoreMarker = true;
    info(`DemoMeta.lastReset set 90 min back (was ${marker.lastReset}); restored at the end`);
    // The measuring stick: a one-row timestamp update must show up.
    const d = fpDiff(fpA, await fingerprint());
    result(
      d.some((x) => x.startsWith("rows.public.DemoMeta")) && d.some((x) => x.startsWith("writeCounters.public.DemoMeta")),
      "fp",
      "fingerprint detects a single-row update (DemoMeta rows+md5 and write counter moved)",
      d.join(" | ") || "no difference seen"
    );
  } else {
    info("no DemoMeta marker in the dev DB; reseed-on-stale is exercised through the guard only");
  }

  try {
    await unitChecks();
    if (RUNTIME) {
      try {
        await runtimeChecks();
      } finally {
        if (restoreMarker) {
          db("marker-set", marker.lastReset);
          restoreMarker = false;
          info("DemoMeta.lastReset restored");
        }
        // Always, even after a failed preview build: .next must not stay a
        // read-only build (or a broken one) on this machine.
        if (RESTORE) await restoreBuild();
        else info("--no-restore: .next is still the PREVIEW (read-only) build; run `npx next build` to restore");
      }
    }
  } finally {
    if (restoreMarker) {
      db("marker-set", marker.lastReset);
      info("DemoMeta.lastReset restored");
    }
  }

  console.log(`\nTOTAL: ${passed + failed} checks, ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.log(`FAIL  gate    crashed :: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e}`);
  console.log(`\nTOTAL: ${passed + failed + 1} checks, ${passed} passed, ${failed + 1} failed`);
  process.exit(1);
});
