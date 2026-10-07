import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { maybeReseedDemo } from "@/lib/demoReset";
import { prisma } from "@/lib/db";
import { revalidateAll } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

/** Vercel cron fallback · daily on Hobby · DEMO_MODE reseeds on API if >60m */
export async function GET(req: Request) {
  // Fail closed: a missing header, a wrong bearer and an unset CRON_SECRET
  // are all the same 401 · see lib/cronAuth.ts.
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    process.env.DEMO_MODE !== "true" &&
    process.env.NEXT_PUBLIC_DEMO_MODE !== "true"
  ) {
    return NextResponse.json({ skipped: true, reason: "DEMO_MODE off" });
  }
  const did = await maybeReseedDemo();
  if (did) revalidateAll();
  // Force reseed on cron even if under 60m (cron is the schedule of record)
  if (!did) {
    const { seedDatabase } = await import("@/lib/seedDatabase");
    await seedDatabase();
    await prisma.demoMeta.upsert({
      where: { id: "demo" },
      create: { id: "demo", lastReset: new Date() },
      update: { lastReset: new Date() },
    });
    revalidateAll();
  }
  return NextResponse.json({ ok: true, reseeding: true });
}
