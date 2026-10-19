import { prisma } from "@/lib/db";
import {
  blocksToRecord,
  bookingToClient,
  roomToClient,
  type OwnerData,
} from "@/lib/mappers";
import type { Booking } from "@/lib/ownerTypes";
import { toPriceRule } from "@/lib/pricing";

async function depositPct(): Promise<number> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: "default" },
    select: { depositPct: true },
  });
  const n = hotel?.depositPct ?? 30;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Everything the owner panel works from · owner session only. */
export async function loadOwnerData(): Promise<OwnerData> {
  const [rooms, bookings, blocks, priceRules, pct] = await Promise.all([
    prisma.room.findMany({ orderBy: { rate: "desc" } }),
    prisma.booking.findMany({ orderBy: { checkIn: "desc" } }),
    prisma.roomBlock.findMany({ include: { room: { select: { slug: true } } } }),
    prisma.seasonalPriceRule.findMany({ orderBy: { startDate: "asc" } }),
    depositPct(),
  ]);

  return {
    rooms: rooms.map(roomToClient),
    bookings: bookings.map(bookingToClient),
    blocks: blocksToRecord(blocks),
    priceRules: priceRules.map(toPriceRule),
    depositPct: pct,
  };
}

/**
 * v18 · What a guest page may see. Rooms, rate rules, closed nights and the
 * deposit share are public; bookings are reduced to the room and the nights
 * they hold (what /book needs to grey out a sold-out room), with every
 * personal field emptied. A signed-in guest's own bookings come back in full
 * (minus passport data) so /account can list them.
 */
export async function loadGuestData(guestUserId: string | null): Promise<OwnerData> {
  const today = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const [rooms, bookings, blocks, priceRules, pct, links] = await Promise.all([
    prisma.room.findMany({ orderBy: { rate: "desc" } }),
    prisma.booking.findMany({
      where: { status: { not: "cancelled" }, checkOut: { gte: today } },
      select: { id: true, roomSlug: true, checkIn: true, checkOut: true, status: true },
    }),
    prisma.roomBlock.findMany({
      where: { dateIso: { gte: today } },
      include: { room: { select: { slug: true } } },
    }),
    prisma.seasonalPriceRule.findMany({ orderBy: { startDate: "asc" } }),
    depositPct(),
    guestUserId
      ? prisma.guestBooking.findMany({
          where: { userId: guestUserId },
          include: { booking: true },
        })
      : Promise.resolve([]),
  ]);

  const own = new Map<string, Booking>();
  for (const link of links) {
    const full = bookingToClient(link.booking);
    own.set(full.id, { ...full, passportId: undefined, nationality: undefined });
  }

  const anonymous: Booking[] = bookings
    .filter((b) => !own.has(b.id))
    .map((b) => ({
      id: b.id,
      code: "",
      guest: "",
      phone: "",
      email: "",
      roomSlug: b.roomSlug,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      source: "Direct",
      amount: 0,
      status: b.status as Booking["status"],
      notes: "",
    }));

  return {
    rooms: rooms.map(roomToClient),
    bookings: [...Array.from(own.values()), ...anonymous],
    blocks: blocksToRecord(blocks),
    priceRules: priceRules.map(toPriceRule),
    depositPct: pct,
  };
}
