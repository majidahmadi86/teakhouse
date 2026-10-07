/**
 * v17 · Dev-database helper for scripts/preview-safety.js.
 *
 * Runs as its own short-lived process, so the gate never keeps the Prisma
 * query engine loaded while it runs `prisma generate` (Windows locks the DLL).
 * Talks ONLY to the local dev database: it refuses any DATABASE_URL that is not
 * localhost:55432. It prints one JSON document on stdout.
 *
 *   node scripts/lib/preview-safety-db.js fingerprint
 *   node scripts/lib/preview-safety-db.js ids
 *   node scripts/lib/preview-safety-db.js marker-get
 *   node scripts/lib/preview-safety-db.js marker-set <iso>
 *   node scripts/lib/preview-safety-db.js lo-create | lo-unlink <oid>
 *   node scripts/lib/preview-safety-db.js purge-preview-qa
 */
const { PrismaClient } = require("@prisma/client");

const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const DEV_PORT = "55432";

function devUrl() {
  const raw = process.env.DATABASE_URL || "";
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a URL");
  }
  if (!DEV_HOSTS.has(u.hostname) || u.port !== DEV_PORT) {
    // Never echo the URL: it may carry a password.
    throw new Error(`refusing: DATABASE_URL is not the local dev DB (host ${u.hostname}:${u.port})`);
  }
  return raw;
}

/** Quote an identifier for SQL. */
const qi = (s) => `"${String(s).replace(/"/g, '""')}"`;

/**
 * Every user table: exact row count plus md5 over all its rows (each row as
 * text, ordered), every sequence's last_value, and the per-table write
 * counters (n_tup_ins/upd/del), which also move for statements that were
 * rolled back. Reads never change any of these.
 */
async function fingerprint(db) {
  const tables = await db.$queryRawUnsafe(
    "SELECT table_schema AS s, table_name AS t FROM information_schema.tables " +
      "WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema') " +
      "AND table_schema NOT LIKE 'pg_toast%' ORDER BY 1, 2"
  );
  const rows = {};
  for (const { s, t } of tables) {
    const [r] = await db.$queryRawUnsafe(
      `SELECT count(*)::text AS n, md5(coalesce(string_agg(x::text, chr(10) ORDER BY x::text), '')) AS h FROM ${qi(s)}.${qi(t)} AS x`
    );
    rows[`${s}.${t}`] = `${r.n}:${r.h}`;
  }
  const seqs = await db.$queryRawUnsafe(
    "SELECT schemaname AS s, sequencename AS q, coalesce(last_value::text, 'null') AS v FROM pg_sequences " +
      "WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1, 2"
  );
  const sequences = {};
  for (const { s, q, v } of seqs) sequences[`${s}.${q}`] = v;
  // Large objects (lo_create, lo_import, lo_from_bytea) live in the catalog,
  // outside every user table and write counter, so count them on their own.
  const [lo] = await db.$queryRawUnsafe(
    "SELECT count(*)::text AS n, md5(coalesce(string_agg(oid::text, ',' ORDER BY oid), '')) AS h " +
      "FROM pg_catalog.pg_largeobject_metadata"
  );
  rows["pg_catalog.pg_largeobject_metadata"] = `${lo.n}:${lo.h}`;
  const stats = await db.$queryRawUnsafe(
    "SELECT schemaname AS s, relname AS t, n_tup_ins::text AS i, n_tup_upd::text AS u, n_tup_del::text AS d " +
      "FROM pg_stat_user_tables ORDER BY 1, 2"
  );
  const writeCounters = {};
  for (const { s, t, i, u, d } of stats) writeCounters[`${s}.${t}`] = `ins=${i} upd=${u} del=${d}`;
  const [{ server_version }] = await db.$queryRawUnsafe("SHOW server_version");
  return { serverVersion: server_version, tableCount: tables.length, rows, sequences, writeCounters };
}

async function firstId(db, table, extra = "") {
  const r = await db.$queryRawUnsafe(`SELECT id FROM ${qi(table)} ${extra} ORDER BY id LIMIT 1`);
  return r[0] ? r[0].id : null;
}

async function ids(db) {
  const [room] = await db.$queryRawUnsafe('SELECT id, slug, rate FROM "Room" ORDER BY id LIMIT 1');
  const rule = room
    ? await db.$queryRawUnsafe('SELECT id FROM "SeasonalPriceRule" WHERE "roomId" = $1 ORDER BY id LIMIT 1', room.id)
    : [];
  return {
    Room: room ? room.id : null,
    roomSlug: room ? room.slug : null,
    roomRate: room ? room.rate : null,
    SeasonalPriceRule: rule[0] ? rule[0].id : null,
    Booking: await firstId(db, "Booking"),
    ContactMessage: await firstId(db, "ContactMessage"),
    DiningCategory: await firstId(db, "DiningCategory"),
    DiningItem: await firstId(db, "DiningItem"),
    EventRequest: await firstId(db, "EventRequest"),
    HotelEvent: await firstId(db, "HotelEvent", "WHERE published = true"),
    TableReservation: await firstId(db, "TableReservation"),
    User: await firstId(db, "User"),
  };
}

async function main() {
  const cmd = process.argv[2];
  const db = new PrismaClient({ datasourceUrl: devUrl() });
  try {
    let out;
    if (cmd === "fingerprint") out = await fingerprint(db);
    else if (cmd === "ids") out = await ids(db);
    else if (cmd === "marker-get") {
      const r = await db.$queryRawUnsafe('SELECT "lastReset" AS at FROM "DemoMeta" WHERE id = \'demo\'');
      out = { lastReset: r[0] ? new Date(r[0].at).toISOString() : null };
    } else if (cmd === "marker-set") {
      const at = new Date(process.argv[3]);
      if (Number.isNaN(at.getTime())) throw new Error("marker-set needs an ISO time");
      const n = await db.demoMeta.updateMany({ where: { id: "demo" }, data: { lastReset: at } });
      out = { updated: n.count, lastReset: at.toISOString() };
    } else if (cmd === "lo-create") {
      // The fingerprint's measuring stick for large objects; lo-unlink undoes it.
      const [r] = await db.$queryRawUnsafe("SELECT lo_create(0)::text AS oid");
      out = { oid: r.oid };
    } else if (cmd === "lo-unlink") {
      const oid = String(process.argv[3] || "");
      if (!/^[0-9]+$/.test(oid)) throw new Error("lo-unlink needs an oid");
      const [r] = await db.$queryRawUnsafe(`SELECT lo_unlink(${oid}::oid) AS ok`);
      out = { unlinked: r.ok === 1 };
    } else if (cmd === "purge-preview-qa") {
      // Only the production control writes, and only rows named QA_PreviewSafety.
      const where = { name: { startsWith: "QA_PreviewSafety" } };
      out = {
        tableReservation: (await db.tableReservation.deleteMany({ where })).count,
        eventRequest: (await db.eventRequest.deleteMany({ where })).count,
        contactMessage: (await db.contactMessage.deleteMany({ where })).count,
      };
    } else throw new Error(`unknown command ${cmd}`);
    process.stdout.write(JSON.stringify(out));
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  process.stderr.write(String(e && e.message ? e.message : e));
  process.exit(1);
});
