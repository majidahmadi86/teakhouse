import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingToClient } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const row = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bookingToClient(row));
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const patch = (await req.json()) as Partial<Booking>;
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

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await prisma.guestBooking.deleteMany({ where: { bookingId: params.id } });
    await prisma.booking.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/bookings DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
