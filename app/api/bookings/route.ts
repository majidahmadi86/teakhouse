import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GUEST } from "@/lib/audit";
import { gate, isDenied, readJson } from "@/lib/api";
import { createBooking } from "@/lib/booking/createBooking";
import { bookingToClient } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";
import { limitOrReject } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Every booking · staff only. Guests read their own through /api/account. */
export async function GET(req: Request) {
  const g = await gate(req, "bookings:read");
  if (isDenied(g)) return g.denied;
  const rows = await prisma.booking.findMany({ orderBy: { checkIn: "desc" } });
  return NextResponse.json(rows.map(bookingToClient));
}

type PostBody = Partial<Booking> & {
  addons?: unknown;
  currency?: string;
  guests?: number;
};

/**
 * Create a booking · the guest-facing write. Rate limited, priced by the
 * server, and refused with 409 when the last unit is gone (see
 * lib/booking/createBooking.ts for the lock that makes that reliable).
 *
 * A staff session may pass `source` and `status` (a walk-in checked in at the
 * desk); an anonymous caller is always a Direct booking awaiting arrival.
 */
export async function POST(req: Request) {
  const limited = limitOrReject(req, "booking");
  if (limited) return limited;
  const body = await readJson<PostBody>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const g = await gate(req);
  const staff = !isDenied(g) && !g.actor.sandbox ? g.actor : null;

  try {
    const result = await createBooking(
      {
        guest: body.guest ?? "",
        phone: body.phone,
        email: body.email,
        roomSlug: body.roomSlug ?? "",
        checkIn: body.checkIn ?? "",
        checkOut: body.checkOut ?? "",
        adults: body.adults ?? (typeof body.guests === "number" ? body.guests : null),
        children: body.children ?? null,
        arrivalTime: body.arrivalTime,
        specialRequests: body.specialRequests,
        notes: body.notes,
        passportId: body.passportId,
        nationality: body.nationality,
        source: staff ? body.source ?? "Direct" : "Direct",
        status: staff && body.status === "in" ? "in" : "ok",
        addons: body.addons,
        currency: body.currency,
        id: typeof body.id === "string" && /^bk-[\w-]{1,40}$/.test(body.id) ? body.id : undefined,
        code: typeof body.code === "string" && /^[A-Z]{3}-\d{4}$/.test(body.code) ? body.code : undefined,
      },
      staff ?? GUEST
    );

    if (!result.ok) {
      const status = result.error === "overbooked" ? 409 : result.error === "room_not_found" ? 404 : 422;
      return NextResponse.json(
        {
          error: result.error,
          detail: result.detail,
          quote: result.quote
            ? { total: result.quote.total, unitsLeft: result.quote.unitsLeft, blockedBy: result.quote.blockedBy }
            : undefined,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        ...bookingToClient(result.booking),
        quote: result.quote
          ? {
              total: result.quote.total,
              roomTotal: result.quote.roomTotal,
              addonsTotal: result.quote.addonsTotal,
              deposit: result.quote.deposit,
              balance: result.quote.balance,
              lines: result.quote.stay.lines,
              addons: result.quote.addons,
              display: result.quote.display,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[api/bookings POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
