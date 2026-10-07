/**
 * v17 · Unit half of scripts/preview-safety.js. Run through tsx with
 * VERCEL_ENV=preview against the LOCAL dev database only:
 *
 *   VERCEL_ENV=preview DEMO_MODE=true DATABASE_URL=<dev> npx tsx scripts/lib/preview-safety-unit.ts
 *
 * Imports the real lib/db and attempts every kind of write. Each must throw
 * ReadOnlyDeploymentError before reaching the database; reads must still work.
 * The parent compares a full database fingerprint before and after this run.
 * Prints PASS/FAIL lines; exit code 1 on any FAIL.
 */
import { completeChat, getAiProvider, isAiConfigured } from "../../lib/ai";
import { prisma, readOnlyAllows } from "../../lib/db";
import { claimDemoReset } from "../../lib/demoReset";
import { sendConfirmationEmail } from "../../lib/email";
import { READ_ONLY_CODE, isReadOnlyDeployment } from "../../lib/readOnly";
import { seedDatabase } from "../../lib/seedDatabase";
import { uploadMedia } from "../../lib/storage";

let failed = 0;
let passed = 0;

function report(ok: boolean, label: string, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  unit  ${label}${detail ? ` :: ${detail}` : ""}`);
}

function errInfo(e: unknown): string {
  const err = e as { name?: string; code?: string; message?: string };
  return `${err?.name ?? "?"}/${err?.code ?? "?"}: ${String(err?.message ?? e).split("\n")[0].slice(0, 120)}`;
}

/** The operation must throw the read-only error. */
async function refused(label: string, run: () => Promise<unknown>) {
  try {
    const r = await run();
    report(false, `refuses ${label}`, `did NOT throw (returned ${JSON.stringify(r)?.slice(0, 80)})`);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    const name = (e as { name?: string })?.name;
    report(
      code === READ_ONLY_CODE && name === "ReadOnlyDeploymentError",
      `refuses ${label}`,
      code === READ_ONLY_CODE ? "" : `threw something else: ${errInfo(e)}`
    );
  }
}

/** The operation must succeed. */
async function allowed(label: string, run: () => Promise<unknown>) {
  try {
    await run();
    report(true, `allows ${label}`);
  } catch (e) {
    report(false, `allows ${label}`, errInfo(e));
  }
}

/**
 * The fail-closed matrix. Writable only for VERCEL_ENV=production, or off
 * Vercel with a database URL that genuinely points at this machine. The
 * remote host is under .invalid, which never resolves; nothing connects.
 */
const MATRIX_KEYS = ["VERCEL_ENV", "VERCEL", "VERCEL_URL", "VERCEL_REGION", "VERCEL_DEPLOYMENT_ID", "DATABASE_URL", "DB_READ_ONLY"] as const;
const LOCAL_URL = "postgresql://qa:qa@localhost:55432/teakhouse";
const REMOTE_URL = "postgresql://qa:qa@db.qa-remote.invalid:6543/postgres?pgbouncer=true";
type MatrixEnv = Partial<Record<(typeof MATRIX_KEYS)[number], string>>;
const MATRIX: [string, MatrixEnv, boolean][] = [
  ["VERCEL_ENV=preview, local DB", { VERCEL_ENV: "preview", VERCEL: "1", DATABASE_URL: LOCAL_URL }, true],
  ["VERCEL_ENV=preview, remote DB", { VERCEL_ENV: "preview", VERCEL: "1", DATABASE_URL: REMOTE_URL }, true],
  ["VERCEL_ENV=development", { VERCEL_ENV: "development", DATABASE_URL: LOCAL_URL }, true],
  ["VERCEL_ENV=production, remote DB", { VERCEL_ENV: "production", VERCEL: "1", DATABASE_URL: REMOTE_URL }, false],
  ["VERCEL_ENV=production without VERCEL", { VERCEL_ENV: "production", DATABASE_URL: REMOTE_URL }, false],
  ["VERCEL_ENV=Production (wrong case)", { VERCEL_ENV: "Production", DATABASE_URL: REMOTE_URL }, true],
  ["VERCEL_ENV unset, remote DB (local script)", { DATABASE_URL: REMOTE_URL }, true],
  ["VERCEL=1, no VERCEL_ENV, local DB", { VERCEL: "1", DATABASE_URL: LOCAL_URL }, true],
  ["VERCEL=1, no VERCEL_ENV, remote DB", { VERCEL: "1", DATABASE_URL: REMOTE_URL }, true],
  ["VERCEL_URL only, local DB", { VERCEL_URL: "x.vercel.app", DATABASE_URL: LOCAL_URL }, true],
  ["VERCEL_REGION only, local DB", { VERCEL_REGION: "hnd1", DATABASE_URL: LOCAL_URL }, true],
  ["VERCEL_DEPLOYMENT_ID only, local DB", { VERCEL_DEPLOYMENT_ID: "dpl_qa", DATABASE_URL: LOCAL_URL }, true],
  ["off Vercel, localhost", { DATABASE_URL: LOCAL_URL }, false],
  ["off Vercel, 127.0.0.1", { DATABASE_URL: "postgresql://qa@127.0.0.1:55432/teakhouse" }, false],
  ["off Vercel, [::1]", { DATABASE_URL: "postgresql://qa@[::1]:55432/teakhouse" }, false],
  ["off Vercel, postgres:// scheme", { DATABASE_URL: "postgres://qa@localhost:55432/teakhouse" }, false],
  ["off Vercel, LOCALHOST upper case", { DATABASE_URL: "postgresql://qa@LOCALHOST:55432/teakhouse" }, false],
  ["localhost with ?host= (remote)", { DATABASE_URL: `${LOCAL_URL}?host=db.qa-remote.invalid` }, true],
  ["localhost with ?host= (socket dir)", { DATABASE_URL: `${LOCAL_URL}?host=/var/run/postgresql` }, true],
  ["localhost with ?hostaddr=", { DATABASE_URL: `${LOCAL_URL}?sslmode=disable&hostaddr=203.0.113.9` }, true],
  ["localhost with ?HOST= (upper case)", { DATABASE_URL: `${LOCAL_URL}?HOST=db.qa-remote.invalid` }, true],
  ["localhost with ?ho%73t= (encoded)", { DATABASE_URL: `${LOCAL_URL}?ho%73t=db.qa-remote.invalid` }, true],
  ["localhost with ?service=", { DATABASE_URL: `${LOCAL_URL}?service=prod` }, true],
  ["localhost.<remote> lookalike", { DATABASE_URL: "postgresql://qa@localhost.qa-remote.invalid:5432/x" }, true],
  ["127.0.0.1.<remote> lookalike", { DATABASE_URL: "postgresql://qa@127.0.0.1.qa-remote.invalid:5432/x" }, true],
  ["multi-host list", { DATABASE_URL: "postgresql://qa@localhost:55432,db.qa-remote.invalid:5432/x" }, true],
  ["userinfo trick (localhost@remote)", { DATABASE_URL: "postgresql://localhost@db.qa-remote.invalid:5432/x" }, true],
  ["127.1 shorthand", { DATABASE_URL: "postgresql://qa@127.1:55432/x" }, true],
  ["IPv4-mapped ::ffff:127.0.0.1", { DATABASE_URL: "postgresql://qa@[::ffff:127.0.0.1]:55432/x" }, true],
  ["http:// scheme on localhost", { DATABASE_URL: "http://localhost:55432/x" }, true],
  ["prisma:// (Accelerate)", { DATABASE_URL: "prisma://accelerate.prisma-data.net/?api_key=qa" }, true],
  ["DATABASE_URL unset", {}, true],
  ["DATABASE_URL not a URL", { DATABASE_URL: "not a url" }, true],
  ["DB_READ_ONLY=1, local DB", { DATABASE_URL: LOCAL_URL, DB_READ_ONLY: "1" }, true],
  ["DB_READ_ONLY=1, production", { VERCEL_ENV: "production", VERCEL: "1", DATABASE_URL: REMOTE_URL, DB_READ_ONLY: "1" }, true],
  ["DB_READ_ONLY=0, local DB", { DATABASE_URL: LOCAL_URL, DB_READ_ONLY: "0" }, false],
];

function envMatrix() {
  const keep: Record<string, string | undefined> = {};
  for (const k of MATRIX_KEYS) keep[k] = process.env[k];
  const set = (env: Record<string, string | undefined>) => {
    for (const k of MATRIX_KEYS) {
      if (env[k] === undefined) delete process.env[k];
      else process.env[k] = env[k];
    }
  };
  try {
    for (const [label, env, want] of MATRIX) {
      set(env);
      const got = isReadOnlyDeployment();
      report(got === want, `isReadOnlyDeployment() ${label} -> ${want ? "read-only" : "writable"}`, got === want ? "" : `got ${got ? "read-only" : "writable"}`);
    }
  } finally {
    set(keep);
  }
}

/**
 * The guard is an allowlist of model reads. Every top-level operation is
 * refused, including ones this Prisma version does not have yet, and every
 * model operation that is not one of the eight reads.
 */
function operationAllowlist() {
  const reads = ["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy"];
  const bad = reads.filter((op) => !readOnlyAllows("Room", op));
  report(bad.length === 0, `guard allows the ${reads.length} model reads`, bad.join(", "));
  const refusedOps: [string | undefined, string][] = [
    [undefined, "$queryRaw"],
    [undefined, "$queryRawUnsafe"],
    [undefined, "$executeRaw"],
    [undefined, "$executeRawUnsafe"],
    [undefined, "$queryRawTyped"],
    [undefined, "$runCommandRaw"],
    [undefined, "$someFutureOperation"],
    [undefined, "findMany"],
    ["Room", "updateManyAndReturn"],
    ["Room", "findRaw"],
    ["Room", "aggregateRaw"],
    ["Room", "someFutureWrite"],
    ["", "findMany"],
  ];
  const leaks = refusedOps.filter(([m, op]) => readOnlyAllows(m, op)).map(([m, op]) => `${m ?? "(top level)"}.${op}`);
  report(leaks.length === 0, `guard refuses ${refusedOps.length} non-read operations (all raw SQL, unknown top-level and model operations)`, leaks.join(", "));
}

/**
 * Raw SQL in every form a reviewer used to walk past the old text classifier,
 * plus plain reads: with no classifier, a read is refused exactly like a write.
 * Each string goes to $queryRawUnsafe; each must throw the read-only error
 * before Postgres sees it.
 */
const RAW_BYPASS_FORMS: [string, string][] = [
  ["plain read SELECT 1", "SELECT 1"],
  ["read of a real table", 'SELECT count(*)::int AS n FROM "Room"'],
  ["SHOW", "SHOW server_version"],
  ["EXPLAIN", "EXPLAIN SELECT 1"],
  ["advisory lock", "SELECT pg_try_advisory_xact_lock(4242) AS ok"],
  ["quoted function name", `SELECT "setval"('qa_preview_safety_seq', 1)`],
  ["schema-qualified quoted name", `SELECT "pg_catalog"."set_config"('application_name', 'qa', false)`],
  ["comment between name and paren", "SELECT setval/**/('qa_preview_safety_seq', 1)"],
  ["comment inside set_config", "SELECT set_config/* x */('application_name', 'qa', false)"],
  ["bare-CR line comment, then a DELETE", '-- read only\rDELETE FROM "SeasonalPriceRule" RETURNING id'],
  ["bare-CR comment hiding a writable CTE", 'SELECT 1 --\r, (WITH d AS (DELETE FROM "SeasonalPriceRule" RETURNING 1) SELECT count(*) FROM d)'],
  ["volatile user function", "SELECT qa_preview_safety_volatile()"],
  ["large object create", "SELECT lo_create(0)"],
  ["large object from bytea", "SELECT lo_from_bytea(0, 'qa'::bytea)"],
  ["nextval", "SELECT nextval('qa_preview_safety_seq')"],
  ["dollar-quoted DO block", 'DO $q$ BEGIN DELETE FROM "SeasonalPriceRule"; END $q$'],
];

/**
 * The concierge makes no outbound AI call when read-only, even with a
 * provider and key configured. fetch is replaced by a spy that records and
 * refuses, so nothing could leave the machine even if the guard failed.
 */
async function concierge() {
  const keys = ["AI_PROVIDER", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY"] as const;
  const keep: Record<string, string | undefined> = {};
  for (const k of keys) keep[k] = process.env[k];
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: unknown) => {
    calls.push(String(input instanceof Request ? input.url : input));
    throw new Error("qa: outbound fetch refused by the preview-safety spy");
  }) as typeof fetch;
  try {
    for (const [provider, keyVar] of [["anthropic", "ANTHROPIC_API_KEY"], ["openai", "OPENAI_API_KEY"], ["groq", "GROQ_API_KEY"]] as const) {
      process.env.AI_PROVIDER = provider;
      process.env[keyVar] = "qa-preview-safety-not-a-key";
      const configured = isAiConfigured();
      const chosen = getAiProvider();
      const before = calls.length;
      const r = await completeChat({ system: "QA", messages: [{ role: "user", content: "QA" }], timeoutMs: 2000 });
      const fetched = calls.length - before;
      report(
        !configured && chosen === null && !r.ok && fetched === 0,
        `concierge AI with ${provider} configured: not configured, completeChat() makes no outbound call`,
        `configured=${configured} provider=${chosen} ok=${r.ok} fetches=${fetched}`
      );
    }
    // Control: the spy does see a call when the process is writable (off
    // Vercel, dev DB on localhost). The spy refuses it, so nothing leaves.
    const vercelEnv = process.env.VERCEL_ENV;
    delete process.env.VERCEL_ENV;
    try {
      const before = calls.length;
      await completeChat({ system: "QA", messages: [{ role: "user", content: "QA" }], timeoutMs: 2000 });
      report(calls.length - before === 1, "control: the fetch spy sees the call when writable (so 0 above is real)", `fetches=${calls.length - before}`);
    } finally {
      process.env.VERCEL_ENV = vercelEnv;
    }
  } finally {
    globalThis.fetch = realFetch;
    for (const k of keys) {
      if (keep[k] === undefined) delete process.env[k];
      else process.env[k] = keep[k];
    }
  }
}

async function main() {
  if (process.env.VERCEL_ENV !== "preview") {
    console.log("FAIL  unit  must run with VERCEL_ENV=preview");
    process.exit(1);
  }
  report(isReadOnlyDeployment(), "VERCEL_ENV=preview makes the deployment read-only");
  envMatrix();
  operationAllowlist();

  const room = await prisma.room.findFirst({ orderBy: { id: "asc" } });
  if (!room) {
    report(false, "dev DB has a Room row to aim writes at");
    return;
  }
  const now = new Date();
  const later = "2099-01-02";

  // Model writes, each one aimed at real rows so it would succeed unguarded.
  await refused("create", () =>
    prisma.demoMeta.create({ data: { id: "qa-preview-safety", lastReset: now } })
  );
  await refused("createMany", () =>
    prisma.demoMeta.createMany({ data: [{ id: "qa-preview-safety-1", lastReset: now }] })
  );
  await refused("createManyAndReturn", () =>
    prisma.demoMeta.createManyAndReturn({ data: [{ id: "qa-preview-safety-2", lastReset: now }] })
  );
  await refused("update", () =>
    prisma.room.update({ where: { id: room.id }, data: { rate: room.rate + 1 } })
  );
  await refused("updateMany", () =>
    prisma.room.updateMany({ data: { rate: { increment: 1 } } })
  );
  await refused("upsert", () =>
    prisma.demoMeta.upsert({
      where: { id: "demo" },
      create: { id: "demo", lastReset: now },
      update: { lastReset: now },
    })
  );
  await refused("delete", () => prisma.demoMeta.delete({ where: { id: "demo" } }));
  await refused("deleteMany", () => prisma.seasonalPriceRule.deleteMany({}));
  await refused("nested write via update", () =>
    prisma.room.update({
      where: { id: room.id },
      data: { blocks: { create: { dateIso: later } } },
    })
  );

  // Raw SQL.
  await refused("$executeRawUnsafe UPDATE", () =>
    prisma.$executeRawUnsafe('UPDATE "Room" SET "rate" = "rate" + 1')
  );
  await refused("$executeRaw UPDATE (tagged)", () =>
    prisma.$executeRaw`UPDATE "Room" SET "rate" = "rate" + ${1}`
  );
  await refused("$executeRawUnsafe SELECT (execute is never allowed)", () =>
    prisma.$executeRawUnsafe("SELECT 1")
  );
  await refused("$queryRawUnsafe INSERT ... RETURNING", () =>
    prisma.$queryRawUnsafe(
      "INSERT INTO \"DemoMeta\" (\"id\", \"lastReset\") VALUES ('qa-preview-safety-raw', now()) RETURNING \"id\""
    )
  );
  await refused("$queryRaw DELETE ... RETURNING (tagged)", () =>
    prisma.$queryRaw`DELETE FROM "SeasonalPriceRule" WHERE "roomId" = ${room.id} RETURNING id`
  );
  await refused("$queryRawUnsafe WITH ... DELETE", () =>
    prisma.$queryRawUnsafe(
      'WITH d AS (DELETE FROM "SeasonalPriceRule" RETURNING 1) SELECT count(*)::int AS n FROM d'
    )
  );
  await refused("$queryRawUnsafe SELECT INTO", () =>
    prisma.$queryRawUnsafe('SELECT * INTO "qa_preview_safety_copy" FROM "Room"')
  );
  await refused("$queryRawUnsafe comment-led DELETE", () =>
    prisma.$queryRawUnsafe('/* read */ DELETE FROM "SeasonalPriceRule"')
  );
  await refused("$queryRawUnsafe set_config", () =>
    prisma.$queryRawUnsafe("SELECT set_config('application_name', 'qa', false)")
  );
  for (const [label, sql] of RAW_BYPASS_FORMS) {
    await refused(`$queryRawUnsafe ${label}`, () => prisma.$queryRawUnsafe(sql));
  }
  await refused("$queryRaw SELECT (tagged read)", () =>
    prisma.$queryRaw`SELECT id FROM "Room" WHERE id = ${room.id}`
  );
  await refused("$queryRaw quoted setval (tagged)", () =>
    prisma.$queryRaw`SELECT "setval"('qa_preview_safety_seq', ${1})`
  );
  await refused("$executeRaw SELECT (tagged)", () => prisma.$executeRaw`SELECT ${1}`);
  await refused("raw read inside interactive $transaction", () =>
    prisma.$transaction(async (tx) => tx.$queryRawUnsafe("SELECT 1"))
  );
  await refused("raw read inside batch $transaction", () =>
    prisma.$transaction([prisma.$queryRawUnsafe("SELECT 1")])
  );

  // Transactions: interactive and batch.
  await refused("write inside interactive $transaction", () =>
    prisma.$transaction(async (tx) => {
      await tx.room.count();
      return tx.room.update({ where: { id: room.id }, data: { rate: room.rate + 1 } });
    })
  );
  await refused("raw write inside interactive $transaction", () =>
    prisma.$transaction(async (tx) =>
      tx.$executeRawUnsafe('DELETE FROM "SeasonalPriceRule"')
    )
  );
  await refused("write inside batch $transaction", () =>
    prisma.$transaction([
      prisma.room.count(),
      prisma.room.update({ where: { id: room.id }, data: { rate: room.rate + 1 } }),
    ])
  );
  await refused("raw write inside batch $transaction", () =>
    prisma.$transaction([prisma.$executeRawUnsafe('DELETE FROM "SeasonalPriceRule"')])
  );

  // App-level write paths.
  await refused("seedDatabase()", () => seedDatabase());
  // HF-1's reset claim is one conditional UPDATE of the DemoMeta marker.
  await refused("claimDemoReset() (the reset marker claim)", () => claimDemoReset());
  const up = await uploadMedia("qa/preview-safety.png", new ArrayBuffer(8), "image/png");
  report(!up.ok && up.error === "read-only-deployment", "uploadMedia() refuses (Supabase storage)", JSON.stringify(up));
  const mail = await sendConfirmationEmail({ to: "qa@example.com", subject: "QA", body: "QA" });
  report(!mail.ok, "sendConfirmationEmail() sends nothing", JSON.stringify(mail));
  await concierge();

  // Reads keep working.
  await allowed("findMany", () => prisma.room.findMany({ take: 3 }));
  await allowed("findUnique", () => prisma.room.findUnique({ where: { id: room.id } }));
  await allowed("count / aggregate / groupBy", async () => {
    await prisma.room.count();
    await prisma.room.aggregate({ _max: { rate: true } });
    await prisma.room.groupBy({ by: ["capacity"], _count: true });
  });
  await allowed("reads inside interactive $transaction", () =>
    prisma.$transaction(async (tx) => {
      await tx.room.count();
      return tx.room.findFirst();
    })
  );
  await allowed("reads inside batch $transaction", () =>
    prisma.$transaction([prisma.room.count(), prisma.hotel.findFirst()])
  );
}

main()
  .catch((e) => {
    report(false, "unit run crashed", errInfo(e));
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
    console.log(`UNIT_TOTAL ${passed} ${failed}`);
    process.exit(failed ? 1 : 0);
  });
