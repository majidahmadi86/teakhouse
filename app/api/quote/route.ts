import { NextResponse } from "next/server";
import { readJson } from "@/lib/api";
import { buildQuote, isQuoteError, type QuoteRequest } from "@/lib/quoteEngine";
import { limitOrReject } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * v15 · The authoritative quote · what the booking page shows and what the
 * booking service charges. GET for a quick look, POST with packages.
 *
 *   GET  /api/quote?room=river-loft&in=2026-10-01&out=2026-10-04&g=2&cur=USD
 *   POST /api/quote { roomSlug, checkIn, checkOut, guests, addons, currency }
 */
async function answer(req: Request, q: QuoteRequest) {
  const limited = limitOrReject(req, "quote");
  if (limited) return limited;
  const quote = await buildQuote(q);
  if (isQuoteError(quote)) {
    return NextResponse.json({ error: quote.error }, { status: quote.error === "room_not_found" ? 404 : 400 });
  }
  return NextResponse.json(quote, { headers: { "cache-control": "no-store" } });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const addons = u.searchParams.getAll("addon").map((key) => ({ key, qty: 1 }));
  return answer(req, {
    roomSlug: u.searchParams.get("room") ?? "",
    checkIn: u.searchParams.get("in") ?? "",
    checkOut: u.searchParams.get("out") ?? "",
    guests: Number(u.searchParams.get("g") ?? 2),
    currency: u.searchParams.get("cur") ?? "THB",
    addons,
  });
}

export async function POST(req: Request) {
  const body = await readJson<QuoteRequest>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  return answer(req, {
    roomSlug: String(body.roomSlug ?? ""),
    checkIn: String(body.checkIn ?? ""),
    checkOut: String(body.checkOut ?? ""),
    guests: Number(body.guests ?? 2),
    currency: typeof body.currency === "string" ? body.currency : "THB",
    addons: body.addons,
  });
}
