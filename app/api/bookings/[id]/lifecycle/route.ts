import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { cancelBooking } from "@/lib/booking/createBooking";
import { bookingToClient } from "@/lib/mappers";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
type Body = { action?: "checkin" | "checkout" | "cancel" | "noshow" };

/**
 * v15 · Front-desk lifecycle · check-in stamps the arrival and dirties nothing;
 * check-out stamps the departure and marks the room dirty for housekeeping.
 */
export async function POST(req: Request, { params }: Ctx) {
  const g = await gate(req, "bookings:checkin");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return bad("Not found", 404);

  if (body.action === "cancel" || body.action === "noshow") {
    const updated = await cancelBooking(params.id, g.actor, body.action);
    return NextResponse.json(bookingToClient(updated!));
  }

  if (body.action === "checkin") {
    if (booking.status === "cancelled") return bad("Cancelled booking cannot check in", 409);
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: "in", checkedInAt: new Date() },
    });
    await audit(g.actor, "booking.checkin", "booking", params.id, { code: booking.code });
    return NextResponse.json(bookingToClient(updated));
  }

  if (body.action === "checkout") {
    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: { status: "out", checkedOutAt: new Date() },
      }),
      prisma.room.update({
        where: { slug: booking.roomSlug },
        data: { hkStatus: "dirty", hkUpdatedAt: new Date() },
      }),
    ]);
    await audit(g.actor, "booking.checkout", "booking", params.id, { code: booking.code });
    return NextResponse.json(bookingToClient(updated));
  }

  return bad("action must be checkin | checkout | cancel | noshow");
}
