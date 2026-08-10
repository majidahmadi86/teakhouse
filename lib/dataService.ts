import { prisma } from "@/lib/db";
import {
  blocksToRecord,
  bookingToClient,
  roomToClient,
  type OwnerData,
} from "@/lib/mappers";

export async function loadOwnerData(): Promise<OwnerData> {
  const [rooms, bookings, blocks] = await Promise.all([
    prisma.room.findMany({ orderBy: { rate: "desc" } }),
    prisma.booking.findMany({ orderBy: { checkIn: "desc" } }),
    prisma.roomBlock.findMany({ include: { room: { select: { slug: true } } } }),
  ]);

  return {
    rooms: rooms.map(roomToClient),
    bookings: bookings.map(bookingToClient),
    blocks: blocksToRecord(blocks),
  };
}
