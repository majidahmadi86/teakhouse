import { NextResponse } from "next/server";
import { maybeReseedDemo } from "@/lib/demoReset";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Vercel cron fallback · hourly reseed when DEMO_MODE=true */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    process.env.DEMO_MODE !== "true" &&
    process.env.NEXT_PUBLIC_DEMO_MODE !== "true"
  ) {
    return NextResponse.json({ skipped: true, reason: "DEMO_MODE off" });
  }
  const did = await maybeReseedDemo();
  // Force reseed on cron even if under 60m (cron is the schedule of record)
  if (!did) {
    const { seedDatabase } = await import("@/lib/seedDatabase");
    await seedDatabase();
    await prisma.demoMeta.upsert({
      where: { id: "demo" },
      create: { id: "demo", lastReset: new Date() },
      update: { lastReset: new Date() },
    });
  }
  return NextResponse.json({ ok: true, reseeding: true });
}
