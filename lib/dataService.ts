import { prisma } from "@/lib/db";
import {
  blocksToRecord,
  bookingToClient,
  roomToClient,
  type OwnerData,
} from "@/lib/mappers";
import { toPriceRule } from "@/lib/pricing";

export async function loadOwnerData(): Promise<OwnerData> {
  const [rooms, bookings, blocks, priceRules] = await Promise.all([
    prisma.room.findMany({ orderBy: { rate: "desc" } }),
    prisma.booking.findMany({ orderBy: { checkIn: "desc" } }),
    prisma.roomBlock.findMany({ include: { room: { select: { slug: true } } } }),
    prisma.seasonalPriceRule.findMany({ orderBy: { startDate: "asc" } }),
  ]);

  return {
    rooms: rooms.map((r) => ({
      ...roomToClient(r),
      units: r.units,
      hkStatus: r.hkStatus as "clean" | "dirty" | "inspected" | "ooo",
    })),
    bookings: bookings.map(bookingToClient),
    blocks: blocksToRecord(blocks),
    priceRules: priceRules.map(toPriceRule),
  };
}
