import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyEmailPlaceholders, sendConfirmationEmail } from "@/lib/email";
import { formatBaht } from "@/lib/utils";

/**
 * v15 · Booking confirmation · the owner's template, the live deposit
 * percentage, the stub or real email provider. Moved out of the route so
 * every creation path (direct, channel, concierge) sends the same message.
 */
export async function sendBookingConfirmation(
  created: Prisma.BookingGetPayload<{}>
): Promise<void> {
  if (!created.email) return;
  const [hotel, room, template] = await Promise.all([
    prisma.hotel.findUnique({ where: { id: "default" } }),
    prisma.room.findUnique({ where: { slug: created.roomSlug } }),
    prisma.emailTemplate.findUnique({
      where: { hotelId_key: { hotelId: "default", key: "booking_confirmation" } },
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
  const body = applyEmailPlaceholders(
    template?.body ??
      "Dear {{guestName}},\n\nThank you for booking {{roomName}} from {{checkIn}} to {{checkOut}}.\nTotal: {{amount}}\n\n{{hotelName}}",
    vars
  );
  await sendConfirmationEmail({ to: created.email, subject, body, bookingCode: created.code });
}
