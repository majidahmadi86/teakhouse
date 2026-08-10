import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  applyEmailPlaceholders,
  sendConfirmationEmail,
} from "@/lib/email";
import { bookingToClient, bookingToDb } from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";
import { formatBaht } from "@/lib/utils";

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

    // Stub confirmation email · does not send until EMAIL_PROVIDER is wired
    if (created.email) {
      try {
        const [hotel, room, template] = await Promise.all([
          prisma.hotel.findUnique({ where: { id: "default" } }),
          prisma.room.findUnique({ where: { slug: created.roomSlug } }),
          prisma.emailTemplate.findUnique({
            where: {
              hotelId_key: {
                hotelId: "default",
                key: "booking_confirmation",
              },
            },
          }),
        ]);
        const depositPct = hotel?.depositPct ?? 30;
        const deposit = Math.round((created.amount * depositPct) / 100);
        const vars: Record<string, string> = {
          hotelName: hotel?.name ?? "The Teak House",
          guestName: created.guest,
          code: created.code,
          roomName: room?.nameEn ?? created.roomSlug,
          checkIn: created.checkIn,
          checkOut: created.checkOut,
          amount: formatBaht(created.amount),
          deposit: formatBaht(deposit),
        };
        const subject = applyEmailPlaceholders(
          template?.subject ?? "Your stay at {{hotelName}} · {{code}}",
          vars
        );
        const emailBody = applyEmailPlaceholders(
          template?.body ??
            "Dear {{guestName}},\n\nThank you for booking {{roomName}} from {{checkIn}} to {{checkOut}}.\nTotal: {{amount}}\n\n{{hotelName}}",
          vars
        );
        await sendConfirmationEmail({
          to: created.email,
          subject,
          body: emailBody,
          bookingCode: created.code,
        });
      } catch (emailErr) {
        console.error("[api/bookings] confirmation email stub failed", emailErr);
      }
    }

    return NextResponse.json(bookingToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/bookings POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
