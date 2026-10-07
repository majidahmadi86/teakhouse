import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingToClient } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";
import { requireOwner } from "@/lib/ownerSession";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const row = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bookingToClient(row));
}

/**
 * A signed-in guest cancelling their own booking from /account. The guest
 * account has no server session (its id lives in localStorage, as before
 * HF-1), so this path is deliberately narrow: the body must be exactly
 * { status: "cancelled", guestUserId } and that guest account must already be
 * linked to this booking. It can change nothing else.
 */
async function guestCancel(
  bookingId: string,
  body: unknown
): Promise<NextResponse | null> {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const keys = Object.keys(b).sort().join(",");
  if (keys !== "guestUserId,status" || b.status !== "cancelled") return null;
  if (typeof b.guestUserId !== "string" || !b.guestUserId) return null;
  const link = await prisma.guestBooking.findUnique({
    where: { userId_bookingId: { userId: b.guestUserId, bookingId } },
  });
  if (!link) return null;
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  });
  return NextResponse.json(bookingToClient(updated));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = requireOwner(req);
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* refused or rejected below */
  }
  if (denied) {
    // Not the owner · the only other change allowed here is a guest
    // cancelling a booking on their own account.
    try {
      return (await guestCancel(params.id, body)) ?? denied;
    } catch (e) {
      console.error("[api/bookings PATCH guest cancel]", e);
      return denied;
    }
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const patch = body as Partial<Booking>;
    const data: Record<string, unknown> = {};
    const keys: (keyof Booking)[] = [
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
      "passportId",
      "nationality",
      "adults",
      "children",
      "arrivalTime",
      "specialRequests",
    ];
    for (const k of keys) {
      if (k in patch) {
        const v = patch[k];
        data[k] = v === undefined ? null : v;
      }
    }
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(bookingToClient(updated));
  } catch (e) {
    console.error("[api/bookings PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    await prisma.guestBooking.deleteMany({ where: { bookingId: params.id } });
    await prisma.booking.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/bookings DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
