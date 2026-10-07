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
import { prisma } from "../../lib/db";
import { claimDemoReset } from "../../lib/demoReset";
import { sendConfirmationEmail } from "../../lib/email";
import {
  READ_ONLY_CODE,
  isReadOnlyDeployment,
  isReadOnlySql,
} from "../../lib/readOnly";
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

function sqlClassifier() {
  const reads = [
    "SELECT 1",
    "  select * from \"Room\" where rate > 0",
    "WITH r AS (SELECT id FROM \"Room\") SELECT count(*) FROM r",
    "SHOW server_version",
    "EXPLAIN SELECT 1",
    "/* lead */ SELECT 1",
    "-- lead\nSELECT 1;",
    "(SELECT 1)",
    "SELECT pg_try_advisory_xact_lock(4242)",
    "SELECT \"lastReset\" FROM \"DemoMeta\"",
  ];
  const writes = [
    "INSERT INTO \"DemoMeta\" (id) VALUES ('x')",
    "UPDATE \"Room\" SET rate = 1",
    "DELETE FROM \"Room\"",
    "WITH d AS (DELETE FROM \"Room\" RETURNING 1) SELECT count(*) FROM d",
    "WITH u AS (UPDATE \"Room\" SET rate = 1 RETURNING 1) SELECT 1",
    "SELECT * INTO qa_copy FROM \"Room\"",
    "SELECT 1; DELETE FROM \"Room\"",
    "SELECT '--'; DELETE FROM \"Room\"",
    "EXPLAIN ANALYZE DELETE FROM \"Room\"",
    "/* x */ DELETE FROM \"Room\"",
    "TRUNCATE \"Room\"",
    "ALTER TABLE \"Room\" ADD COLUMN x int",
    "DROP TABLE \"Room\"",
    "CREATE TABLE qa_x (id int)",
    "GRANT ALL ON \"Room\" TO public",
    "REVOKE ALL ON \"Room\" FROM public",
    "COPY \"Room\" TO STDOUT",
    "CALL qa_proc()",
    "DO $$ BEGIN DELETE FROM \"Room\"; END $$",
    "MERGE INTO \"Room\" r USING \"Room\" s ON r.id = s.id WHEN MATCHED THEN DELETE",
    "SELECT nextval('qa_seq')",
    "SELECT setval('qa_seq', 1)",
    "SELECT set_config('default_transaction_read_only', 'off', false)",
    "SELECT pg_terminate_backend(1)",
    "SELECT * FROM \"Room\" FOR UPDATE",
    "VACUUM \"Room\"",
    "",
  ];
  let bad = reads.filter((s) => !isReadOnlySql(s));
  report(bad.length === 0, `isReadOnlySql accepts ${reads.length} read statements`, bad.join(" | "));
  bad = writes.filter((s) => isReadOnlySql(s));
  report(bad.length === 0, `isReadOnlySql rejects ${writes.length} write statements`, bad.join(" | "));
}

async function main() {
  if (process.env.VERCEL_ENV !== "preview") {
    console.log("FAIL  unit  must run with VERCEL_ENV=preview");
    process.exit(1);
  }
  report(isReadOnlyDeployment(), "VERCEL_ENV=preview makes the deployment read-only");
  envMatrix();
  sqlClassifier();

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
  await allowed("$queryRawUnsafe SELECT", async () => {
    const r = (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "Room"')) as { n: number }[];
    if (!(r[0]?.n > 0)) throw new Error("no rows");
  });
  await allowed("$queryRaw SELECT (tagged)", () =>
    prisma.$queryRaw`SELECT id FROM "Room" WHERE id = ${room.id}`
  );
  await allowed("WITH / SHOW / EXPLAIN", async () => {
    await prisma.$queryRawUnsafe('WITH r AS (SELECT id FROM "Room") SELECT count(*)::int AS n FROM r');
    await prisma.$queryRawUnsafe("SHOW server_version");
    await prisma.$queryRawUnsafe("EXPLAIN SELECT 1");
  });
  await allowed("SELECT pg_try_advisory_xact_lock (read-only in effect)", () =>
    prisma.$queryRawUnsafe("SELECT pg_try_advisory_xact_lock(4242) AS ok")
  );
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
