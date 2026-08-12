import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/seedDatabase";

const HOUR_MS = 60 * 60 * 1000;

export function isDemoModeServer(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

/** One reseed at a time within this process. */
let inFlight: Promise<boolean> | null = null;

/**
 * If demo mode and the last reset is over an hour old, reseed. Call from API
 * entry points.
 *
 * The reseed is claimed atomically before it runs. A page load fans out into
 * several API calls at once, and previously each one that saw a stale marker
 * started its own seedDatabase(): one seed would delete the bookings while
 * another was busy re-inserting them, and the loser blew up on the booking to
 * room foreign key. The caller then got a 500, the guest store fell back to
 * seed data, and the whole site quietly dropped to base rates with no rate
 * rules. Now exactly one caller wins the claim and the rest return immediately.
 */
export async function maybeReseedDemo(): Promise<boolean> {
  if (!isDemoModeServer()) return false;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - HOUR_MS);

    // Conditional update · atomic in Postgres, so only one caller sees count 1.
    const claimed = await prisma.demoMeta.updateMany({
      where: { id: "demo", lastReset: { lt: cutoff } },
      data: { lastReset: now },
    });

    if (claimed.count === 0) {
      const meta = await prisma.demoMeta.findUnique({ where: { id: "demo" } });
      // Marker is fresh · someone else has it, or it simply is not due.
      if (meta) return false;
      try {
        // No marker at all (first boot) · creating it is the claim.
        await prisma.demoMeta.create({ data: { id: "demo", lastReset: now } });
      } catch {
        return false; // lost the create race
      }
    }

    await seedDatabase();
    await prisma.demoMeta.upsert({
      where: { id: "demo" },
      create: { id: "demo", lastReset: new Date() },
      update: { lastReset: new Date() },
    });
    return true;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
