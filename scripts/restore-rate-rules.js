/**
 * Restore the demo's seasonal rate rules · ADDITIVE, deletes nothing.
 *
 * Why this exists: an older deployment's seedRateRules() anchored high season
 * and Songkran to hard-coded years. Once those years passed, its own
 * "skip rules that already ended" filter dropped every rule, so a reset run
 * against that build deleted SeasonalPriceRule and wrote nothing back · the
 * live demo lost season pricing, mixed-rate stays and the owner rate grid,
 * while every other table stayed intact.
 *
 * Current seedDatabase() anchors the rules to seed time and is correct. This
 * script writes just that one table so the fix does not require a full reseed
 * (a full reseed deletes before it writes · far more exposure for a repair
 * this narrow).
 *
 * Refuses to run if rules already exist, so it can never double up.
 *
 *   node scripts/restore-rate-rules.js
 */

const fs = require("fs");

for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (y, m1, d) => `${y}-${pad2(m1)}-${pad2(d)}`;
const iso = (d) => ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const lastFeb = (y) =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;

/** Same three layers, same dates, as seedRateRules() in lib/seedDatabase.ts. */
function rulesFor(roomId, anchor) {
  const anchorIso = iso(anchor);
  const year = anchor.getFullYear();
  const rules = [];

  for (const y of [year, year + 1]) {
    const endDate = ymd(y + 1, 2, lastFeb(y + 1));
    if (endDate < anchorIso) continue;
    rules.push({
      roomId,
      kind: "season",
      label: "High season",
      startDate: ymd(y, 12, 1),
      endDate,
      multiplier: 1.1,
      price: null,
    });
  }

  for (const y of [year, year + 1, year + 2]) {
    const endDate = ymd(y, 4, 15);
    if (endDate < anchorIso) continue;
    rules.push({
      roomId,
      kind: "override",
      label: "Songkran",
      startDate: ymd(y, 4, 13),
      endDate,
      multiplier: 1.35,
      price: null,
    });
  }

  const toFriday = (5 - anchor.getDay() + 7) % 7;
  const friday = addDays(anchor, toFriday === 0 ? 7 : toFriday);
  rules.push({
    roomId,
    kind: "season",
    label: "Weekend premium",
    startDate: iso(friday),
    endDate: iso(addDays(friday, 1)),
    multiplier: 1.15,
    price: null,
  });

  return rules;
}

async function main() {
  const existing = await prisma.seasonalPriceRule.count();
  if (existing > 0) {
    console.log(`${existing} rate rules already present · nothing to restore`);
    return;
  }

  const rooms = await prisma.room.findMany({ select: { id: true } });
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);
  const data = rooms.flatMap((r) => rulesFor(r.id, anchor));

  await prisma.seasonalPriceRule.createMany({ data });
  console.log(`restored ${data.length} rate rules across ${rooms.length} rooms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
