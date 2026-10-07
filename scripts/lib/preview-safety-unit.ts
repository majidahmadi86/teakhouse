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

function envMatrix() {
  const keep = { v: process.env.VERCEL_ENV, d: process.env.DB_READ_ONLY };
  const cases: [string | undefined, string | undefined, boolean][] = [
    ["preview", undefined, true],
    ["production", undefined, false],
    [undefined, undefined, false],
    ["development", undefined, false],
    [undefined, "1", true],
    ["production", "", false],
  ];
  for (const [v, d, want] of cases) {
    if (v === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = v;
    if (d === undefined) delete process.env.DB_READ_ONLY;
    else process.env.DB_READ_ONLY = d;
    const got = isReadOnlyDeployment();
    report(got === want, `isReadOnlyDeployment() VERCEL_ENV=${v ?? "unset"} DB_READ_ONLY=${d ?? "unset"} -> ${want}`, got === want ? "" : `got ${got}`);
  }
  if (keep.v === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = keep.v;
  if (keep.d === undefined) delete process.env.DB_READ_ONLY;
  else process.env.DB_READ_ONLY = keep.d;
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
