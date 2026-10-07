/**
 * Database fingerprint · row count and md5 of every public table's rows.
 *
 * full()    every column of every row, rows ordered by their text form · any
 *           write at all (a touched timestamp included) changes it
 * stable()  the same minus columns a reseed always rewrites (timestamps and
 *           the cuid ids Prisma mints per run) · equal for two seeds made on
 *           the same day, so "is this the seeded state?" has an exact answer
 *
 * Used by scripts/hf1-security.js. Read-only: SELECTs only.
 */

const VOLATILE_COLUMNS = new Set(["createdAt", "updatedAt", "lastReset"]);
/** Tables whose id is a cuid minted per insert rather than a seeded value. */
const CUID_ID_TABLES = new Set([
  "SeasonalPriceRule",
  "EmailTemplate",
  "GuestBooking",
  "RoomBlock",
  "TableReservation",
  "EventRequest",
  "ContactMessage",
]);

const q = (name) => `"${name.replace(/"/g, '""')}"`;

async function tables(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name`
  );
  return rows.map((r) => r.table_name);
}

async function columns(prisma, table) {
  const rows = await prisma.$queryRawUnsafe(
    `select column_name from information_schema.columns
      where table_schema = 'public' and table_name = $1
      order by ordinal_position`,
    table
  );
  return rows.map((r) => r.column_name);
}

async function fingerprint(prisma, { stable = false } = {}) {
  const out = {};
  for (const t of await tables(prisma)) {
    let expr = "t::text";
    if (stable) {
      const cols = (await columns(prisma, t)).filter(
        (c) =>
          !VOLATILE_COLUMNS.has(c) && !(c === "id" && CUID_ID_TABLES.has(t))
      );
      expr = `row(${cols.map((c) => `t.${q(c)}`).join(", ")})::text`;
    }
    const [r] = await prisma.$queryRawUnsafe(
      `select count(*)::int as n,
              coalesce(md5(string_agg(${expr}, '|' order by ${expr})), '') as h
         from ${q(t)} t`
    );
    out[t] = { n: r.n, h: r.h };
  }
  return out;
}

const full = (prisma) => fingerprint(prisma, { stable: false });
const stable = (prisma) => fingerprint(prisma, { stable: true });

/** Table names whose count or hash differ between two fingerprints. */
function diff(a, b) {
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changed = [];
  for (const n of names) {
    const x = a[n];
    const y = b[n];
    if (!x || !y || x.n !== y.n || x.h !== y.h) {
      changed.push(`${n}(${x ? x.n : "-"}->${y ? y.n : "-"})`);
    }
  }
  return changed;
}

function counts(fp) {
  return Object.fromEntries(Object.entries(fp).map(([k, v]) => [k, v.n]));
}

module.exports = { full, stable, diff, counts };
