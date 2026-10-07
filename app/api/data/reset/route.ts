import { NextResponse } from "next/server";
import { loadOwnerData } from "@/lib/dataService";
import { claimDemoReset } from "@/lib/demoReset";
import { requireOwner } from "@/lib/ownerSession";
import { revalidateAll } from "@/lib/revalidate";
import { isSameOrigin } from "@/lib/sameOrigin";
import { seedDatabase } from "@/lib/seedDatabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Reset DB to seed · the owner panel's "Reset demo data".
 *
 * HF-1: this was an anonymous full database rewrite. Now, in order:
 *   401  no valid owner or demo session (always, whatever else is wrong)
 *   403  not same-origin (Origin must name this host, or Sec-Fetch-Site
 *        must say same-origin when there is no Origin)
 *   429  someone reset (or the cron reseeded) less than 10 minutes ago ·
 *        one reset per 10 minutes for the whole site, claimed atomically
 *        through the DemoMeta marker
 */
export async function POST(req: Request) {
  const denied = requireOwner(req);
  if (denied) return denied;
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin" }, { status: 403 });
  }

  try {
    const claim = await claimDemoReset();
    if (!claim.ok) {
      return NextResponse.json(
        { error: "rate-limited", retryAfterSec: claim.retryAfterSec },
        {
          status: 429,
          headers: { "Retry-After": String(claim.retryAfterSec) },
        }
      );
    }

    // One transaction · it writes the DemoMeta marker itself.
    await seedDatabase();
    // The reseed rewrites every table the guest pages read · drop all tags so
    // the demo does not keep serving the previous seed's menu and events.
    revalidateAll();
    const data = await loadOwnerData();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/data/reset]", e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
