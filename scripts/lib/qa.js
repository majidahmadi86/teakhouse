/**
 * QA data marking and cleanup · shared by every acceptance suite.
 *
 * The suites exercise real guest flows against a real database, so they leave
 * real rows behind: a booking, table reservations, seat requests, a contact
 * message. Nothing removed them, so a demo opened in front of a client showed
 * "QA NoScript" sitting in the owner's reservation list next to the seeded
 * data. The nightly reseed cleared it, which is not good enough · the pollution
 * lived for up to 24 hours.
 *
 * Two halves, and both matter:
 *
 *   qa("NoScript")   every row a suite writes carries the QA_ prefix in the
 *                    field an owner reads, so QA rows are identifiable by
 *                    inspection rather than by remembering a list of names
 *   purgeQaData()    deletes exactly those rows · called in a finally block at
 *                    the end of every run, so a suite cleans up after itself
 *                    even when it fails partway through
 *
 * The prefix is the contract. Anything a suite writes MUST go through qa(), or
 * the cleanup will not find it.
 */

const fs = require("fs");
const path = require("path");

/**
 * Scripts run outside Next, so nothing has loaded .env for us. Existing
 * environment wins · CI or a shell export should override the file.
 */
function loadEnv() {
  const file = path.join(__dirname, "..", "..", ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const QA_PREFIX = "QA_";

/** Mark a value as suite-generated. Use for every name, note and subject. */
function qa(label) {
  return `${QA_PREFIX}${label}`;
}

/**
 * Rows written before the prefix existed. Kept so the first run after this
 * change clears the backlog · a demo that is already polluted heals itself
 * rather than waiting for someone to remember to run a one-off script.
 */
const LEGACY_NAMES = [
  "Regression Guest",
  "QA NoScript",
  "QA Script",
  "QA Closed",
  "QA Invalid",
  "QA Seats NoJS",
  "QA Contact NoJS",
  "QA",
];
const LEGACY_PREFIXES = ["V11 Season Test", "QA "];
const LEGACY_NOTES = ["Table near the water"];

/**
 * Delete every suite-generated row. Safe to call when there is nothing to
 * delete, and safe to call twice.
 *
 * Returns a per-table count so a suite can print what it removed · silence
 * would make a broken cleanup indistinguishable from a clean run.
 */
async function purgeQaData({ quiet = false } = {}) {
  loadEnv();
  // Required lazily · a suite that never touches the database should not pay
  // for the client, and th-overflow.js has no business importing Prisma.
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const byName = {
    OR: [
      { name: { startsWith: QA_PREFIX } },
      { name: { in: LEGACY_NAMES } },
      ...LEGACY_PREFIXES.map((p) => ({ name: { startsWith: p } })),
    ],
  };
  const byNameOrNotes = {
    OR: [
      ...byName.OR,
      { notes: { startsWith: QA_PREFIX } },
      { notes: { in: LEGACY_NOTES } },
    ],
  };
  const byGuest = {
    OR: [
      { guest: { startsWith: QA_PREFIX } },
      { guest: { in: LEGACY_NAMES } },
      ...LEGACY_PREFIXES.map((p) => ({ guest: { startsWith: p } })),
    ],
  };

  const counts = {};
  try {
    // Seat requests reference events, so they go before any event cleanup.
    counts.eventRequest = (
      await prisma.eventRequest.deleteMany({ where: byNameOrNotes })
    ).count;
    counts.tableReservation = (
      await prisma.tableReservation.deleteMany({ where: byNameOrNotes })
    ).count;
    counts.contactMessage = (
      await prisma.contactMessage.deleteMany({ where: byName })
    ).count;
    // guestBooking links a guest account to a booking · clear the link first or
    // the booking delete trips the relation.
    const bookings = await prisma.booking.findMany({
      where: byGuest,
      select: { id: true },
    });
    if (bookings.length) {
      const ids = bookings.map((b) => b.id);
      await prisma.guestBooking.deleteMany({ where: { bookingId: { in: ids } } });
    }
    counts.booking = (await prisma.booking.deleteMany({ where: byGuest })).count;
    counts.guest = (await prisma.guest.deleteMany({ where: byName })).count;

    // v12 creates a dining category, a dish and an event through the owner API
    // and deletes them as part of its assertions. If it dies mid-run they
    // survive, so sweep them too. These carry bilingual JSON name columns.
    counts.diningItem = (
      await prisma.diningItem.deleteMany({
        where: { OR: [{ nameEn: { startsWith: QA_PREFIX } }, { nameEn: { startsWith: "QA " } }] },
      })
    ).count;
    counts.diningCategory = (
      await prisma.diningCategory.deleteMany({
        where: { OR: [{ nameEn: { startsWith: QA_PREFIX } }, { nameEn: { startsWith: "QA " } }] },
      })
    ).count;
    counts.hotelEvent = (
      await prisma.hotelEvent.deleteMany({
        where: { OR: [{ titleEn: { startsWith: QA_PREFIX } }, { titleEn: { startsWith: "QA " } }] },
      })
    ).count;
  } finally {
    await prisma.$disconnect();
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!quiet) {
    const detail = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k} ${n}`)
      .join(", ");
    console.log(
      total === 0
        ? "QA cleanup · nothing to remove"
        : `QA cleanup · removed ${total} row${total === 1 ? "" : "s"} (${detail})`
    );
  }
  return { total, counts };
}

/**
 * Wrap a suite's entry point. Cleanup runs whether the suite passed, failed or
 * threw · a crashed suite is exactly when stray rows are most likely.
 */
function withQaCleanup(main) {
  return Promise.resolve()
    .then(main)
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .then(() => purgeQaData())
    .catch((e) => {
      // Never let a cleanup failure hide the suite's own result, but do say so.
      console.error("QA cleanup FAILED ·", e.message || e);
      process.exitCode = 1;
    });
}

module.exports = { qa, QA_PREFIX, purgeQaData, withQaCleanup, loadEnv };
