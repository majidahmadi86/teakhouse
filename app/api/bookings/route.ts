import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingToClient, bookingToDb } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.booking.findMany({ orderBy: { checkIn: "desc" } });
  return NextResponse.json(rows.map(bookingToClient));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Booking;
    const data = bookingToDb({
      ...body,
      phone: body.phone ?? "",
      email: body.email ?? "",
      notes: body.notes ?? "",
    });
    const created = await prisma.booking.create({
      data: { ...data, hotelId: "default" },
    });

    // Upsert CRM guest row
    if (created.email) {
      const gid = `guest-${created.email.toLowerCase()}`;
      await prisma.guest.upsert({
        where: { id: gid },
        create: {
          id: gid,
          name: created.guest,
          email: created.email,
          phone: created.phone,
          passportId: created.passportId,
          nationality: created.nationality,
        },
        update: {
          name: created.guest,
          phone: created.phone,
          passportId: created.passportId,
          nationality: created.nationality,
        },
      });
    }

    return NextResponse.json(bookingToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/bookings POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
