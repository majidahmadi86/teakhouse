import { loadGuestData, loadOwnerData } from "@/lib/dataService";
import { readOwnerSession } from "@/lib/ownerSession";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Read-only. /book, /account and /owner all fetch this on mount, so it must
 * never write: it used to touch the DemoMeta marker and reseed the whole
 * database inline when the marker was over an hour old. The reseed now runs
 * only from the authenticated cron (app/api/cron/reseed).
 *
 * v18 · Only the owner session gets every booking in full. Everyone else gets
 * the guest view (lib/dataService loadGuestData): rooms, rates, closed nights,
 * and bookings reduced to the nights they hold, plus the signed-in guest's own
 * bookings when ?guest=<their account id> is sent.
 */
export async function GET(req: Request) {
  try {
    if (readOwnerSession(req)) {
      return NextResponse.json(await loadOwnerData());
    }
    const guest = new URL(req.url).searchParams.get("guest");
    const guestId = guest && /^[A-Za-z0-9_-]{1,80}$/.test(guest) ? guest : null;
    return NextResponse.json(await loadGuestData(guestId));
  } catch (e) {
    console.error("[api/data]", e);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}
