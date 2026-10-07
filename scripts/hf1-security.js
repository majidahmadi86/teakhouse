/**
 * HF-1 security gate · local only, against the dev database.
 *
 * Proves, with a fingerprint of every table (row count + md5 of every row):
 *   a) the fingerprint is taken before and after every phase
 *   b) every owner/admin write path and every reset/reseed path, fired with
 *      no session, is refused (401; 401 or 403 when cross-origin) and nothing
 *      changes; forged, tampered and expired sessions are refused too; a
 *      valid session from another origin is refused with 403
 *   c) cron: no header 401, wrong bearer 401, CRON_SECRET unset 401 (server
 *      restarted without it), the right bearer reseeds to the seeded state
 *   d) reset: cross-origin 403, no session 401, with a demo session it resets
 *      once, a second reset inside 10 minutes is 429, and of three parallel
 *      resets exactly one wins
 *   e) atomicity: seedDatabase() forced to fail after a step leaves the
 *      fingerprint exactly unchanged (several steps, first to last)
 *   f) GET /api/data, GET /api/email-template and loading /book, /account
 *      and /owner in a browser write nothing, even with a stale DemoMeta
 *      marker and no email template row
 *   g) guest writes still work: a /book booking end to end, the contact form,
 *      guest sign-up/sign-in, the guest cancel on /account, table and seat
 *      requests, the concierge; then every QA row is purged and the
 *      fingerprint is back to exactly what it was
 *
 * It starts and stops its own `next start` on PORT (default 3031), so build
 * first and make sure nothing else listens there:
 *
 *   npx prisma generate && npx next build
 *   node scripts/hf1-security.js
 *
 * Refuses to run unless DATABASE_URL (env, .env.local, .env) is localhost.
 * Leaves the dev database in the seeded state.
 */

const { spawn, spawnSync, execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const fp = require("./lib/dbFingerprint");
const { qa, purgeQaData } = require("./lib/qa");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 3031);
const BASE = `http://localhost:${PORT}`;
const EVIL = "https://evil.example";
const SOVRA_PW = "D:/WorkSpace/projects/customers/sovra/node_modules/playwright";
const { chromium } = require(fs.existsSync(SOVRA_PW) ? SOVRA_PW : "playwright");

// ── results ────────────────────────────────────────────────────────────────
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}
function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 70 - title.length))}`);
}

// ── env and safety ─────────────────────────────────────────────────────────
function readEnvFile(file) {
  const out = {};
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const ENV_LOCAL = readEnvFile(".env.local");
const ENV_FILE = readEnvFile(".env");
const pick = (k) => process.env[k] || ENV_LOCAL[k] || ENV_FILE[k] || "";
const DEV_URL = pick("DATABASE_URL");
const DEV_DIRECT = pick("DIRECT_URL") || DEV_URL;

function isLocalDb(url) {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}
for (const [name, url] of [
  ["DATABASE_URL", DEV_URL],
  ["DIRECT_URL", DEV_DIRECT],
  [".env DATABASE_URL", ENV_FILE.DATABASE_URL || DEV_URL],
  [".env.local DATABASE_URL", ENV_LOCAL.DATABASE_URL || DEV_URL],
]) {
  if (!isLocalDb(url)) {
    console.error(`REFUSED · ${name} is not a localhost database`);
    process.exit(2);
  }
}
for (const f of [".env.production", ".env.production.local"]) {
  if (fs.existsSync(path.join(ROOT, f))) {
    console.error(`REFUSED · ${f} exists; next start would load it`);
    process.exit(2);
  }
}
// Everything below (Prisma here, purgeQaData, the tsx seed runner) uses this.
process.env.DATABASE_URL = DEV_URL;
process.env.DIRECT_URL = DEV_DIRECT;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: DEV_URL } } });

const CRON_SECRET = crypto.randomBytes(24).toString("hex");
const KEY_LABEL = "tkh-owner-session-v1";
const LOCAL_FALLBACK = "teakhouse-LOCAL-DEV-ONLY-not-a-secret";

// ── server lifecycle ───────────────────────────────────────────────────────
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
let server = null;

async function portAnswers() {
  try {
    await fetch(BASE + "/api/owner/session", { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

async function startServer(cronSecret) {
  const env = {
    ...process.env,
    DATABASE_URL: DEV_URL,
    DIRECT_URL: DEV_DIRECT,
    // "" is unset as far as the app is concerned, and .env cannot override it.
    CRON_SECRET: cronSecret,
  };
  delete env.VERCEL;
  delete env.VERCEL_ENV;
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const log = [];
  child.stdout.on("data", (d) => log.push(String(d)));
  child.stderr.on("data", (d) => log.push(String(d)));
  child.log = log;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) break;
    if (await portAnswers()) {
      server = child;
      console.log(`server up · pid ${child.pid} · CRON_SECRET ${cronSecret ? "set" : "UNSET"}`);
      return child;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(log.join(""));
  throw new Error("next start did not come up");
}

async function stopServer() {
  if (!server) return;
  const pid = server.pid;
  if (server.exitCode === null) {
    if (process.platform === "win32") {
      try {
        execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        /* already gone */
      }
    } else {
      server.kill("SIGTERM");
    }
  }
  for (let i = 0; i < 40 && (await portAnswers()); i++) {
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`server stopped · pid ${pid}`);
  server = null;
}

// ── http ───────────────────────────────────────────────────────────────────
async function call(method, url, { body, form, cookie, origin, headers = {} } = {}) {
  const h = { ...headers };
  if (cookie) h.cookie = cookie;
  if (origin) h.origin = origin;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    h["content-type"] = "application/json";
    payload = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(BASE + url, { method, headers: h, body: payload, redirect: "manual" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function demoSession() {
  const r = await call("POST", "/api/owner/session", { body: {}, origin: BASE });
  const set = (r.headers.getSetCookie?.() || []).find((c) => c.startsWith("tkh-owner="));
  return { status: r.status, cookie: set ? set.split(";")[0] : null, set };
}

function signedToken(secretMaterial, kind, exp) {
  const key = crypto.createHmac("sha256", secretMaterial).update(KEY_LABEL).digest();
  const payload = `v1.${kind}.${exp}`;
  const sig = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return `tkh-owner=${payload}.${sig}`;
}

// ── db helpers ─────────────────────────────────────────────────────────────
const full = () => fp.full(prisma);
const stable = () => fp.stable(prisma);
const same = (a, b) => fp.diff(a, b).length === 0;
const showDiff = (a, b) => fp.diff(a, b).join(" ") || "identical";

const SEED_COUNTS = {
  Booking: 40, ContactMessage: 0, DemoMeta: 1, DiningCategory: 3, DiningItem: 18,
  EmailTemplate: 1, EventRequest: 0, Guest: 15, GuestBooking: 2, Hotel: 1,
  HotelEvent: 3, Room: 10, RoomBlock: 0, SeasonalPriceRule: 50,
  TableReservation: 0, User: 1,
};
function seedCountsMatch(f) {
  const c = fp.counts(f);
  return Object.entries(SEED_COUNTS).every(([k, n]) => c[k] === n);
}
async function lastReset() {
  const m = await prisma.demoMeta.findUnique({ where: { id: "demo" } });
  return m ? m.lastReset.getTime() : null;
}
async function backdateMarker(ms) {
  await prisma.demoMeta.update({
    where: { id: "demo" },
    data: { lastReset: new Date(Date.now() - ms) },
  });
}

function runSeed(arg) {
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"), "scripts/hf1-seed-abort.ts", arg],
    { cwd: ROOT, env: { ...process.env }, encoding: "utf8" }
  );
  const line = (r.stdout || "").trim().split(/\r?\n/).filter((l) => l.startsWith("{")).pop();
  try {
    return JSON.parse(line);
  } catch {
    return { ok: false, error: (r.stderr || r.stdout || "").slice(0, 300) };
  }
}

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86400000;

// ── the write paths ────────────────────────────────────────────────────────
async function ids() {
  const room = await prisma.room.findFirst({ orderBy: { id: "asc" } });
  const rule = await prisma.seasonalPriceRule.findFirst({ where: { roomId: room.id } });
  const cat = await prisma.diningCategory.findFirst({ orderBy: { id: "asc" } });
  const dish = await prisma.diningItem.findFirst({ orderBy: { id: "asc" } });
  const ev = await prisma.hotelEvent.findFirst({ orderBy: { id: "asc" } });
  const contact = await prisma.contactMessage.findFirst();
  const resv = await prisma.tableReservation.findFirst();
  const evr = await prisma.eventRequest.findFirst();
  return { room, rule, cat, dish, ev, contact, resv, evr };
}

function ownerWritePaths(x) {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const media = () => {
    const f = new FormData();
    f.append("file", new Blob([png], { type: "image/png" }), "x.png");
    f.append("folder", "misc");
    return f;
  };
  const future = iso(Date.now() + 120 * DAY);
  return [
    { name: "POST /api/blocks", method: "POST", url: "/api/blocks", body: { roomSlug: x.room.slug, dateIso: future } },
    { name: "PATCH /api/bookings/[id]", method: "PATCH", url: "/api/bookings/bk-4301", body: { status: "cancelled", guest: "Hijacked" } },
    { name: "PATCH /api/bookings/[id] guest cancel, account not linked", method: "PATCH", url: "/api/bookings/bk-4301", body: { status: "cancelled", guestUserId: "gu-demo" } },
    { name: "PATCH /api/bookings/[id] guest cancel plus another field", method: "PATCH", url: "/api/bookings/bk-4300", body: { status: "cancelled", guestUserId: "gu-demo", amount: 1 } },
    { name: "DELETE /api/bookings/[id]", method: "DELETE", url: "/api/bookings/bk-4301" },
    { name: "PATCH /api/contact/[id]", method: "PATCH", url: `/api/contact/${x.contact.id}`, body: { status: "done" } },
    { name: "DELETE /api/contact/[id]", method: "DELETE", url: `/api/contact/${x.contact.id}` },
    { name: "POST /api/dining/categories", method: "POST", url: "/api/dining/categories", body: { name: { en: "Hijack", th: "Hijack" }, order: 9, published: true, image: "" } },
    { name: "PATCH /api/dining/categories/[id]", method: "PATCH", url: `/api/dining/categories/${x.cat.id}`, body: { published: false } },
    { name: "DELETE /api/dining/categories/[id]", method: "DELETE", url: `/api/dining/categories/${x.cat.id}` },
    { name: "POST /api/dining/items", method: "POST", url: "/api/dining/items", body: { categoryId: x.cat.id, name: { en: "Hijack", th: "Hijack" }, description: { en: "x", th: "x" }, price: 1, image: "", published: true } },
    { name: "PATCH /api/dining/items/[id]", method: "PATCH", url: `/api/dining/items/${x.dish.id}`, body: { price: 1 } },
    { name: "DELETE /api/dining/items/[id]", method: "DELETE", url: `/api/dining/items/${x.dish.id}` },
    { name: "PATCH /api/email-template", method: "PATCH", url: "/api/email-template", body: { subject: "Hijacked" } },
    { name: "POST /api/email-template", method: "POST", url: "/api/email-template", body: { subject: "Hijacked" } },
    { name: "PATCH /api/event-requests/[id]", method: "PATCH", url: `/api/event-requests/${x.evr.id}`, body: { status: "declined" } },
    { name: "DELETE /api/event-requests/[id]", method: "DELETE", url: `/api/event-requests/${x.evr.id}` },
    { name: "POST /api/events", method: "POST", url: "/api/events", body: { title: { en: "Hijack", th: "Hijack" }, date: future, description: { en: "x", th: "x" }, image: "", published: true } },
    { name: "PATCH /api/events/[id]", method: "PATCH", url: `/api/events/${x.ev.id}`, body: { published: false } },
    { name: "DELETE /api/events/[id]", method: "DELETE", url: `/api/events/${x.ev.id}` },
    { name: "PATCH /api/hotel", method: "PATCH", url: "/api/hotel", body: { name: "Hijacked", reservationsEnabled: false } },
    { name: "POST /api/media", method: "POST", url: "/api/media", form: media },
    { name: "PATCH /api/reservations/[id]", method: "PATCH", url: `/api/reservations/${x.resv.id}`, body: { status: "cancelled" } },
    { name: "DELETE /api/reservations/[id]", method: "DELETE", url: `/api/reservations/${x.resv.id}` },
    { name: "POST /api/rooms", method: "POST", url: "/api/rooms", body: { id: "hijack", slug: "hijack", name: { en: "H", th: "H" } } },
    { name: "PATCH /api/rooms/[id]", method: "PATCH", url: `/api/rooms/${x.room.id}`, body: { rate: 1 } },
    { name: "DELETE /api/rooms/[id]", method: "DELETE", url: `/api/rooms/${x.room.id}` },
    { name: "POST /api/rooms/[id]/pricing", method: "POST", url: `/api/rooms/${x.room.id}/pricing`, body: { kind: "season", label: "Hijack", startDate: future, endDate: future, price: 1 } },
    { name: "PATCH /api/rooms/[id]/pricing", method: "PATCH", url: `/api/rooms/${x.room.id}/pricing`, body: { id: x.rule.id, price: 1 } },
    { name: "DELETE /api/rooms/[id]/pricing", method: "DELETE", url: `/api/rooms/${x.room.id}/pricing?id=${encodeURIComponent(x.rule.id)}` },
    { name: "POST /api/data/reset", method: "POST", url: "/api/data/reset" },
  ];
}

const fire = (p, opts = {}) =>
  call(p.method, p.url, { body: p.body, form: p.form ? p.form() : undefined, ...opts });

// ── phases ─────────────────────────────────────────────────────────────────
async function phaseB() {
  section("b · every owner write, reset and reseed path without a session");
  // Real rows for the guest-generated tables, so every PATCH/DELETE below
  // aims at something that would really change if a gate were missing.
  const tomorrowish = iso(Date.now() + 7 * DAY);
  const c = await call("POST", "/api/contact", { body: { purpose: "other", name: qa("HF1 Gate"), contact: "+66 80 000 0001", message: "Gate target row." } });
  const r = await call("POST", "/api/reservations", { body: { date: tomorrowish, time: "19:00", party: 2, name: qa("HF1 Gate"), contact: "+66 80 000 0001", contactKind: "phone", notes: "" } });
  const ev = await prisma.hotelEvent.findFirst({ orderBy: { date: "asc" } });
  const e = await call("POST", "/api/event-requests", { body: { eventId: ev.id, name: qa("HF1 Gate"), contact: "+66 80 000 0001", contactKind: "phone", guests: 2, notes: "" } });
  check("setup · guest POST /api/contact, /api/reservations, /api/event-requests create target rows (public)", c.status === 201 && r.status === 201 && e.status === 201, `${c.status} ${r.status} ${e.status}`);

  const x = await ids();
  const paths = ownerWritePaths(x);
  const before = await full();

  for (const p of paths) {
    const a = await fire(p);
    check(`no session · ${p.name} → 401`, a.status === 401, `${a.status}`);
    const b = await fire(p, { origin: EVIL });
    check(`no session, cross-origin · ${p.name} → 401/403`, b.status === 401 || b.status === 403, `${b.status}`);
  }

  // Cookies that are not a valid session.
  const now = Date.now();
  const forged = [
    ["expired, correctly signed", signedToken(CRON_SECRET, "demo", now - 1000)],
    ["signed with the local-only fallback key", signedToken(LOCAL_FALLBACK, "owner", now + 3600e3)],
    ["signed with a wrong secret", signedToken("not-the-secret", "owner", now + 3600e3)],
    ["tampered kind", signedToken(CRON_SECRET, "demo", now + 3600e3).replace(".demo.", ".owner.")],
    ["garbage", "tkh-owner=v1.owner.9999999999999.AAAA"],
  ];
  const probe = paths.find((p) => p.name === "PATCH /api/hotel");
  const reset = paths.find((p) => p.name === "POST /api/data/reset");
  for (const [label, cookie] of forged) {
    const a = await fire(probe, { cookie, origin: BASE });
    const b = await fire(reset, { cookie, origin: BASE });
    check(`forged session (${label}) · PATCH /api/hotel and reset → 401`, a.status === 401 && b.status === 401, `${a.status} ${b.status}`);
  }

  // A valid session is still refused from another origin (CSRF lock).
  const s = await demoSession();
  check("a demo session is issued to a same-origin caller (no DB work)", s.status === 200 && !!s.cookie, `${s.status}`);
  check(
    "session cookie is HttpOnly and SameSite=Lax",
    /HttpOnly/i.test(s.set || "") && /SameSite=lax/i.test(s.set || ""),
    (s.set || "").replace(/tkh-owner=[^;]+/, "tkh-owner=<value>")
  );
  let all403 = true;
  const odd = [];
  for (const p of paths) {
    const a = await fire(p, { cookie: s.cookie, origin: EVIL });
    const b = await fire(p, { cookie: s.cookie, headers: { "sec-fetch-site": "cross-site" } });
    if (a.status !== 403 || b.status !== 403) {
      all403 = false;
      odd.push(`${p.name} ${a.status}/${b.status}`);
    }
  }
  check(`valid session but cross-origin (Origin or Sec-Fetch-Site) · all ${paths.length} paths → 403`, all403, odd.join("; "));

  const sx = await call("POST", "/api/owner/session", { body: {}, origin: EVIL });
  const sn = await call("POST", "/api/owner/session", { body: {} });
  check("session endpoint refuses cross-origin and header-less callers → 403", sx.status === 403 && sn.status === 403, `${sx.status} ${sn.status}`);
  const pin = await call("POST", "/api/owner/session", { body: { pin: "not-the-pin" }, origin: BASE });
  check("a wrong PIN gets no session → 401", pin.status === 401 && !(pin.headers.getSetCookie?.() || []).length, `${pin.status}`);

  // Reseed paths.
  for (const [label, headers] of [
    ["no header", {}],
    ["wrong bearer", { authorization: "Bearer wrong" }],
    ["secret without Bearer", { authorization: CRON_SECRET }],
    ["lower-case scheme", { authorization: `bearer ${CRON_SECRET}` }],
    ["truncated secret", { authorization: `Bearer ${CRON_SECRET.slice(0, -1)}` }],
  ]) {
    const a = await call("GET", "/api/cron/reseed", { headers });
    check(`GET /api/cron/reseed (${label}) → 401`, a.status === 401, `${a.status}`);
  }

  const after = await full();
  check("fingerprint unchanged after every refused request", same(before, after), showDiff(before, after));
  return { x };
}

async function phaseF() {
  section("f · read paths write nothing (stale marker, no template row)");
  await prisma.emailTemplate.deleteMany();
  await backdateMarker(2 * 3600e3);
  const markerBefore = await lastReset();
  const before = await full();

  for (let i = 0; i < 3; i++) {
    const r = await call("GET", "/api/data");
    check(`GET /api/data #${i + 1} → 200`, r.status === 200 && Array.isArray(r.json?.rooms), `${r.status}`);
  }
  const t = await call("GET", "/api/email-template");
  check("GET /api/email-template answers the default without creating a row", t.status === 200 && t.json?.id === "" && /\{\{hotelName\}\}/.test(t.json?.subject || ""), `${t.status} id=${JSON.stringify(t.json?.id)}`);

  const browser = await chromium.launch();
  for (const route of ["/book", "/account", "/owner"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const api = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/")) api.push(`${res.request().method()} ${new URL(res.url()).pathname} ${res.status()}`);
    });
    await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2500);
    const loadedData = api.some((a) => a.startsWith("GET /api/data 200"));
    check(`browser load ${route} (fetches /api/data: ${loadedData ? "yes" : "no"})`, true, api.join(", ") || "no api calls");
    await ctx.close();
  }
  await browser.close();

  const after = await full();
  check("fingerprint unchanged: GET /api/data, GET /api/email-template, /book, /account, /owner", same(before, after), showDiff(before, after));
  check("DemoMeta marker untouched (2 h stale, still no reseed)", (await lastReset()) === markerBefore);
  check("no email template row was created", (await prisma.emailTemplate.count()) === 0);
}

async function phaseC(ref) {
  section("c · cron");
  const before = await full();
  const a = await call("GET", "/api/cron/reseed");
  const b = await call("GET", "/api/cron/reseed", { headers: { authorization: "Bearer wrong" } });
  check("cron without header → 401", a.status === 401 && a.json?.error === "Unauthorized", `${a.status}`);
  check("cron with a wrong bearer → 401", b.status === 401, `${b.status}`);
  check("fingerprint unchanged by refused cron calls", same(before, await full()));

  const t0 = Date.now();
  const ok = await call("GET", "/api/cron/reseed", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  const ms = Date.now() - t0;
  check("cron with the right bearer → 200 reseeded", ok.status === 200 && ok.json?.reseeded === true, `${ok.status} ${ms} ms`);
  const after = await full();
  check("the reseed changed the database (fingerprint differs)", !same(before, after), showDiff(before, after).slice(0, 120));
  check("row counts are exactly the seed's", seedCountsMatch(after), JSON.stringify(fp.counts(after)));
  const st = await stable();
  check("content is exactly the seeded state (stable fingerprint = reference seed)", same(ref, st), showDiff(ref, st));
  const lr = await lastReset();
  check("DemoMeta marker is fresh", lr && Date.now() - lr < 120e3, lr ? `${Math.round((Date.now() - lr) / 1000)} s ago` : "missing");

  section("c · cron with CRON_SECRET unset (server restarted without it)");
  await stopServer();
  await startServer("");
  const before2 = await full();
  for (const [label, headers] of [
    ["no header", {}],
    ["the old secret", { authorization: `Bearer ${CRON_SECRET}` }],
    ["empty bearer", { authorization: "Bearer " }],
    ["Bearer undefined", { authorization: "Bearer undefined" }],
  ]) {
    const r = await call("GET", "/api/cron/reseed", { headers });
    check(`CRON_SECRET unset · cron (${label}) → 401`, r.status === 401, `${r.status}`);
  }
  check("fingerprint unchanged with CRON_SECRET unset", same(before2, await full()));
  await stopServer();
  await startServer(CRON_SECRET);
}

async function phaseD(ref) {
  section("d · reset");
  const s = await demoSession();
  const before = await full();
  const a = await call("POST", "/api/data/reset", { cookie: s.cookie, origin: EVIL });
  const b = await call("POST", "/api/data/reset", { cookie: s.cookie });
  const c = await call("POST", "/api/data/reset", { cookie: s.cookie, headers: { "sec-fetch-site": "same-site" } });
  const d = await call("POST", "/api/data/reset", { origin: BASE });
  check("reset with a session, cross-origin Origin → 403", a.status === 403, `${a.status}`);
  check("reset with a session but no Origin and no Sec-Fetch-Site → 403", b.status === 403, `${b.status}`);
  check("reset with a session, Sec-Fetch-Site same-site → 403", c.status === 403, `${c.status}`);
  check("reset same-origin without a session → 401", d.status === 401, `${d.status}`);
  const e = await call("POST", "/api/data/reset", { cookie: s.cookie, origin: BASE });
  check("reset right after the cron reseed → 429 (the cron counts)", e.status === 429, `${e.status} retry-after ${e.headers.get("retry-after")}`);
  check("fingerprint unchanged by every refused reset", same(before, await full()), showDiff(before, await full()));

  await backdateMarker(11 * 60e3);
  const mid = await full();
  const ok = await call("POST", "/api/data/reset", { cookie: s.cookie, origin: BASE });
  check("reset with a demo session, same-origin, marker 11 min old → 200", ok.status === 200 && Array.isArray(ok.json?.rooms), `${ok.status}`);
  const after = await full();
  check("the reset rewrote the database", !same(mid, after));
  const st = await stable();
  check("after the reset the content is exactly the seeded state", same(ref, st), showDiff(ref, st));

  const again = await call("POST", "/api/data/reset", { cookie: s.cookie, origin: BASE });
  const ra = Number(again.headers.get("retry-after"));
  check("a second reset inside 10 minutes → 429 with Retry-After", again.status === 429 && ra > 500 && ra <= 600, `${again.status} retry-after ${ra}`);
  const viaFetchSite = await call("POST", "/api/data/reset", { cookie: s.cookie, headers: { "sec-fetch-site": "same-origin" } });
  check("same-origin by Sec-Fetch-Site (no Origin) is accepted and rate-limited → 429", viaFetchSite.status === 429, `${viaFetchSite.status}`);
  check("fingerprint unchanged by the 429s", same(after, await full()));

  await backdateMarker(11 * 60e3);
  const race = await Promise.all(
    [0, 1, 2].map(() => call("POST", "/api/data/reset", { cookie: s.cookie, origin: BASE }))
  );
  const codes = race.map((r) => r.status).sort();
  check("three parallel resets · exactly one 200, two 429", codes.join(",") === "200,429,429", codes.join(","));
  const st2 = await stable();
  check("after the race the content is exactly the seeded state", same(ref, st2), showDiff(ref, st2));
}

async function phaseE(ref) {
  section("e · atomicity (seedDatabase forced to fail mid-transaction)");
  // Make the pre-state differ from a fresh seed, so "unchanged" cannot be
  // mistaken for "reseeded": a guest row plus an owner edit with a session.
  const s = await demoSession();
  const hotel = await prisma.hotel.findUnique({ where: { id: "default" } });
  const msg = await call("POST", "/api/contact", { body: { purpose: "stay", name: qa("HF1 Atomic"), contact: "+66 80 000 0002", message: "Must survive a failed reseed." } });
  const edit = await call("PATCH", "/api/hotel", { cookie: s.cookie, origin: BASE, body: { tagline: qa("HF1 tagline") } });
  check("setup · guest contact row (public) and owner hotel edit (with session) → 201, 200", msg.status === 201 && edit.status === 200, `${msg.status} ${edit.status}`);
  const before = await full();
  check("pre-state is not the seeded state", !same(ref, await stable()));

  for (const step of ["deletes", "hotel", "rooms", "bookings", "users", "diningItems", "events"]) {
    const r = runSeed(step);
    const after = await full();
    check(`seed aborted after "${step}" → rolled back, fingerprint exactly unchanged`, r.aborted === true && same(before, after), r.aborted ? `${r.ms} ms · ${showDiff(before, after)}` : JSON.stringify(r));
  }
  check("the guest row and the owner edit survived every failed reseed", (await prisma.contactMessage.count({ where: { name: qa("HF1 Atomic") } })) === 1 && (await prisma.hotel.findUnique({ where: { id: "default" } })).tagline === qa("HF1 tagline"));

  const undo = await call("PATCH", "/api/hotel", { cookie: s.cookie, origin: BASE, body: { tagline: hotel.tagline } });
  check("owner edit reverted with the session → 200", undo.status === 200, `${undo.status}`);
  await purgeQaData({ quiet: true });
}

async function phaseG(ref) {
  section("g · guest writes still work");
  const before = await full();
  const room = await prisma.room.findFirst({ where: { active: true }, orderBy: { rate: "asc" } });
  const checkIn = iso(Date.now() + 70 * DAY);
  const checkOut = iso(Date.now() + 72 * DAY);
  const stamp = Date.now().toString(36).toUpperCase();
  const guestName = qa(`HF1 Book ${stamp}`);
  const guestEmail = `hf1-${stamp.toLowerCase()}@example.test`;

  const browser = await chromium.launch();
  let code = "";
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: "UTC" });
    const page = await ctx.newPage();
    const posted = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/bookings") && res.request().method() === "POST") posted.push(res.status());
    });
    await page.goto(`${BASE}/book?in=${checkIn}&out=${checkOut}&room=${room.slug}`, { waitUntil: "load" });
    await page.locator(`#room-${room.slug}`).waitFor({ state: "visible", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.locator(`#room-${room.slug} button`, { hasText: "Select" }).first().click();
    await page.waitForTimeout(400);
    await page.locator("button", { hasText: "Continue to deposit" }).first().click();
    await page.waitForTimeout(800);
    await page.locator('input[placeholder*="passport"], input[placeholder*="ID"]').first().fill(guestName);
    await page.locator('input[type="email"]').first().fill(guestEmail);
    await page.locator('input[type="tel"]').first().fill("+66 80 000 0003");
    await page.locator("button", { hasText: "Pay deposit" }).first().click();
    await page.locator("#tkh-receipt").waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const receipt = await page.locator("#tkh-receipt").innerText().catch(() => "");
    code = (receipt.match(/[A-Z]{3}-\d+/) || [])[0] || "";
    check("/book end to end · the guest POST /api/bookings → 201", posted.includes(201), posted.join(","));
    await ctx.close();
  }
  const stored = await prisma.booking.findFirst({ where: { guest: guestName } });
  check("/book end to end · receipt shown and the booking is stored", !!code && !!stored && stored.code === code, `${code} ${stored ? stored.checkIn + ".." + stored.checkOut : "not stored"}`);

  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/contact?about=stay`, { waitUntil: "load" });
    await page.fill("#ct-name", qa("HF1 Contact"));
    await page.fill("#ct-contact", "hf1-contact@example.test");
    await page.fill("#ct-message", "HF-1 gate: the contact form still submits.");
    await Promise.all([
      page.waitForURL(/[?&](sent|error)=/, { timeout: 60000 }),
      page.locator("button[type='submit']").click({ noWaitAfter: true, force: true }),
    ]);
    const url = page.url();
    await ctx.close();
    const row = await prisma.contactMessage.findFirst({ where: { name: qa("HF1 Contact") } });
    check("contact form (server action) submits and stores the message", /[?&]sent=/.test(url) && !!row, url.replace(BASE, ""));
  }
  await browser.close();

  // Guest account: sign-up attached to the new booking, sign-in, and the
  // narrow guest cancel that replaced the owner PATCH on /account.
  const signup = await call("POST", "/api/users", { body: { action: "signup", name: qa("HF1 User"), email: guestEmail, password: "hf1-pass", bookingId: stored?.id } });
  check("POST /api/users sign-up → 201 (public)", signup.status === 201, `${signup.status}`);
  const signin = await call("POST", "/api/users", { body: { action: "signin", email: guestEmail, password: "hf1-pass" } });
  check("POST /api/users sign-in → 200 (public)", signin.status === 200 && signin.json?.id === signup.json?.id, `${signin.status}`);
  const userId = signup.json?.id;
  if (stored && userId) {
    const notMine = await call("PATCH", "/api/bookings/bk-4301", { body: { status: "cancelled", guestUserId: userId } });
    check("guest cancel of a booking not on the account → 401", notMine.status === 401, `${notMine.status}`);
    const mine = await call("PATCH", `/api/bookings/${stored.id}`, { body: { status: "cancelled", guestUserId: userId } });
    check("guest cancel of their own booking → 200, cancelled", mine.status === 200 && mine.json?.status === "cancelled", `${mine.status}`);
  }

  const t = await call("POST", "/api/reservations", { body: { date: iso(Date.now() + 9 * DAY), time: "18:30", party: 2, name: qa("HF1 Table"), contact: "+66 80 000 0004", contactKind: "phone", notes: "" } });
  check("POST /api/reservations (table request) → 201 (public)", t.status === 201, `${t.status}`);
  const ev = await prisma.hotelEvent.findFirst({ orderBy: { date: "asc" } });
  const sr = await call("POST", "/api/event-requests", { body: { eventId: ev.id, name: qa("HF1 Seats"), contact: "+66 80 000 0005", contactKind: "phone", guests: 2, notes: "" } });
  check("POST /api/event-requests (seat request) → 201 (public)", sr.status === 201, `${sr.status}`);
  const cc = await call("POST", "/api/concierge", { body: { message: "Do you have a room free this weekend?", lang: "en" } });
  check("POST /api/concierge → 200 (public)", cc.status === 200, `${cc.status}`);

  // Cleanup: exactly the rows this phase created.
  if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  const purged = await purgeQaData({ quiet: true });
  const after = await full();
  check(`QA rows purged (${purged.total}) · fingerprint back to exactly the pre-phase state`, same(before, after), showDiff(before, after));
  const st = await stable();
  check("database content is the seeded state", same(ref, st), showDiff(ref, st));
}

async function main() {
  section("a · setup");
  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    throw new Error("no build · run `npx prisma generate && npx next build` first");
  }
  if (await portAnswers()) throw new Error(`something already listens on ${PORT}`);
  console.log(`dev database ${new URL(DEV_URL).host}${new URL(DEV_URL).pathname}`);
  const seeded = runSeed("--full");
  check("reference seed via seedDatabase() (npx tsx)", seeded.ok === true, `${seeded.ms} ms`);
  const ref = await stable();
  check("reference row counts are the seed's", seedCountsMatch(await full()));

  await startServer(CRON_SECRET);
  try {
    await phaseB();
    await phaseF();
    await phaseC(ref);
    await phaseD(ref);
    await phaseE(ref);
    await phaseG(ref);
  } finally {
    await stopServer();
  }
}

main()
  .catch((e) => {
    console.error(e);
    check("gate ran to completion", false, String(e.message || e));
  })
  .then(async () => {
    await stopServer().catch(() => {});
    await purgeQaData({ quiet: true }).catch(() => {});
    await prisma.$disconnect();
    const failed = results.filter((r) => !r.pass);
    console.log(`\nTOTAL ${results.length - failed.length}/${results.length} passed${failed.length ? ` · ${failed.length} FAILED` : ""}`);
    for (const f of failed) console.log(`  FAIL · ${f.name}${f.detail ? " · " + f.detail : ""}`);
    process.exitCode = failed.length ? 1 : 0;
  });
