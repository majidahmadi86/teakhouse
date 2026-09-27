import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied, readJson } from "@/lib/api";
import { getGuestUserId } from "@/lib/auth/session";
import { cancelBooking } from "@/lib/booking/createBooking";
import { bookingToClient } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Staff, or the signed-in guest the booking is attached to. */
export async function GET(req: Request, { params }: Ctx) {
  const row = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { guestLinks: { select: { userId: true } } },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const uid = getGuestUserId(req);
  const owns = uid !== null && row.guestLinks.some((l) => l.userId === uid);
  if (!owns) {
    const g = await gate(req, "bookings:read");
    if (isDenied(g)) return g.denied;
  }
  return NextResponse.json(bookingToClient(row));
}

const EDITABLE: (keyof Booking)[] = [
  "code",
  "guest",
  "phone",
  "email",
  "roomSlug",
  "checkIn",
  "checkOut",
  "source",
  "amount",
  "status",
  "notes",
  "nationality",
  "adults",
  "children",
  "arrivalTime",
  "specialRequests",
];

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await gate(req, "bookings:write");
  if (isDenied(g)) return g.denied;
  try {
    const patch = (await readJson<Partial<Booking>>(req)) ?? {};
    if (patch.status === "cancelled") {
      const updated = await cancelBooking(params.id, g.actor, "staff");
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(bookingToClient(updated));
    }
    const data: Record<string, unknown> = {};
    for (const k of EDITABLE) {
      if (k in patch) {
        const v = patch[k];
        data[k] = v === undefined ? null : v;
      }
    }
    const updated = await prisma.booking.update({ where: { id: params.id }, data });
    await audit(g.actor, "booking.updated", "booking", params.id, { keys: Object.keys(data) });
    return NextResponse.json(bookingToClient(updated));
  } catch (e) {
    console.error("[api/bookings PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await gate(req, "bookings:write");
  if (isDenied(g)) return g.denied;
  try {
    // Release inventory on the channels first, then remove the row.
    await cancelBooking(params.id, g.actor, "deleted");
    await prisma.guestBooking.deleteMany({ where: { bookingId: params.id } });
    await prisma.booking.delete({ where: { id: params.id } });
    await audit(g.actor, "booking.deleted", "booking", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/bookings DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
