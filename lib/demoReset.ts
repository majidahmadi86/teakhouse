import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/seedDatabase";

const HOUR_MS = 60 * 60 * 1000;

export function isDemoModeServer(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

/** If demo mode and last reset > 60 min, reseed. Call from API entry points. */
export async function maybeReseedDemo(): Promise<boolean> {
  if (!isDemoModeServer()) return false;
  const meta = await prisma.demoMeta.findUnique({ where: { id: "demo" } });
  const last = meta?.lastReset?.getTime() ?? 0;
  if (Date.now() - last < HOUR_MS) return false;
  await seedDatabase();
  await prisma.demoMeta.upsert({
    where: { id: "demo" },
    create: { id: "demo", lastReset: new Date() },
    update: { lastReset: new Date() },
  });
  return true;
}
