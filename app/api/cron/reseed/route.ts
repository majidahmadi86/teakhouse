import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { isDemoModeServer } from "@/lib/demoReset";
import { revalidateAll } from "@/lib/revalidate";
import { seedDatabase } from "@/lib/seedDatabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The demo reseed · the ONLY place it runs on a schedule.
 *
 * Vercel Cron calls this daily at 00:00 UTC (vercel.json; Hobby allows one
 * run a day). Guest and owner request paths never reseed: GET /api/data used
 * to reseed inline when the marker was over an hour old, which made any load
 * of /book, /account or /owner a potential full database rewrite.
 */
export async function GET(req: Request) {
  // Fail closed: a missing header, a wrong bearer and an unset CRON_SECRET
  // are all the same 401 · see lib/cronAuth.ts.
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDemoModeServer()) {
    return NextResponse.json({ skipped: true, reason: "DEMO_MODE off" });
  }
  // The seed writes the DemoMeta marker itself.
  await seedDatabase();
  revalidateAll();
  return NextResponse.json({ ok: true, reseeded: true });
}
