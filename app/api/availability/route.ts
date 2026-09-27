import { NextResponse } from "next/server";
import { checkAvailability } from "@/lib/availability";
import { limitOrReject } from "@/lib/rateLimit";
import { validDates } from "@/lib/quoteEngine";

export const dynamic = "force-dynamic";

/**
 * v15 · Every room type for a date range · units left and the yield-priced
 * stay total, from the same snapshot the concierge and the booking service
 * use. GET /api/availability?in=2026-10-01&out=2026-10-04
 */
export async function GET(req: Request) {
  const limited = limitOrReject(req, "quote");
  if (limited) return limited;
  const u = new URL(req.url);
  const checkIn = u.searchParams.get("in") ?? "";
  const checkOut = u.searchParams.get("out") ?? "";
  if (!validDates(checkIn, checkOut)) {
    return NextResponse.json({ error: "invalid_dates" }, { status: 400 });
  }
  const result = await checkAvailability(checkIn, checkOut);
  return NextResponse.json(
    {
      checkIn,
      checkOut,
      nights: result.nights,
      rooms: result.rooms.map((r) => ({
        slug: r.slug,
        available: r.available,
        unitsLeft: r.unitsLeft,
        reason: r.reason,
        total: r.total,
        minNight: r.minNight,
        maxNight: r.maxNight,
        mixed: r.mixed,
        otaTotal: r.otaTotal,
        lines: r.lines,
        minStay: r.minStay,
      })),
      alternatives: result.alternatives,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
