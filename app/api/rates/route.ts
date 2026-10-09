import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookableRooms } from "@/lib/liveRooms";
import { addDaysIso, groupRulesByRoom, lowestNightlyRate, toPriceRule } from "@/lib/pricing";
import { hotelDayIso } from "@/lib/stayDate";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 93;

/**
 * GET /api/rates?start=YYYY-MM-DD&days=62 · the nightly "from" price for each
 * day, for the date picker's calendar on every guest page. Read-only.
 *
 * Priced exactly as /book prices a stay: the catalogue rooms with the
 * database's live rates and rate rules laid over them by slug (lib/liveRooms),
 * the lowest room per night. If the database cannot be read, the answer is an
 * empty map and the calendar simply shows no prices; it never guesses.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const today = hotelDayIso();
  const startParam = url.searchParams.get("start") ?? "";
  const start = ISO.test(startParam) && startParam >= today ? startParam : today;
  const days = Math.min(MAX_DAYS, Math.max(1, Number.parseInt(url.searchParams.get("days") ?? "62", 10) || 62));

  try {
    const [rows, ruleRows] = await Promise.all([
      prisma.room.findMany({ select: { id: true, slug: true, rate: true, ota: true, active: true } }),
      prisma.seasonalPriceRule.findMany(),
    ]);
    const rooms = bookableRooms(rows);
    const rules = groupRulesByRoom(ruleRows.map(toPriceRule));
    const nights: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const day = addDaysIso(start, i);
      const price = lowestNightlyRate(rooms, day, rules);
      if (price != null) nights[day] = price;
    }
    return NextResponse.json(
      { currency: "THB", start, days, nights },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (e) {
    console.error("[api/rates]", e);
    return NextResponse.json({ currency: "THB", start, days, nights: {} }, { headers: { "Cache-Control": "no-store" } });
  }
}
