import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingToClient } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";
import { roomConflict } from "@/lib/availability";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** One booking · PII, so owner session only (v18). */
export async function GET(req: Request, { params }: Ctx) {
  const denied = requireOwner(req);
  if (denied) return denied;
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
  const ro = readOnlyResponse();
  if (ro) return ro;
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
    const patch = body as Partial<Booking> & { force?: boolean };
    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // v18 · A change of room or dates (or reinstating a cancelled stay) is
    // checked against the other bookings and the closed nights. The owner is
    // shown the clash and may save anyway with { force: true }.
    const nextRoom = patch.roomSlug ?? existing.roomSlug;
    const nextIn = patch.checkIn ?? existing.checkIn;
    const nextOut = patch.checkOut ?? existing.checkOut;
    const nextStatus = patch.status ?? existing.status;
    if (nextOut <= nextIn) {
      return NextResponse.json(
        { error: "dates", message: "Check-out must be after check-in." },
        { status: 400 }
      );
    }
    if ("amount" in patch && !(typeof patch.amount === "number" && patch.amount > 0)) {
      return NextResponse.json(
        { error: "amount", message: "The amount must be more than zero." },
        { status: 400 }
      );
    }
    const moved =
      nextRoom !== existing.roomSlug ||
      nextIn !== existing.checkIn ||
      nextOut !== existing.checkOut ||
      (existing.status === "cancelled" && nextStatus !== "cancelled");
    if (moved && nextStatus !== "cancelled" && !patch.force) {
      const clash = await roomConflict(nextRoom, nextIn, nextOut, params.id);
      if (clash.booking || clash.blockedNights.length) {
        return NextResponse.json(
          {
            error: "overlap",
            message: clash.booking
              ? `This room is already booked (${clash.booking.code}) for some of these nights.`
              : "This room is closed for some of these nights.",
            conflict: clash,
          },
          { status: 409 }
        );
      }
    }

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
  const ro = readOnlyResponse();
  if (ro) return ro;
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
