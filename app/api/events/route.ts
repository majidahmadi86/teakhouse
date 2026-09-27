import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  hotelEventToClient,
  hotelEventToDb,
  type HotelEvent,
} from "@/lib/events";
import { revalidateEvents } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

/** All events, soonest first, owner view (includes unpublished). */
export async function GET() {
  const rows = await prisma.hotelEvent.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(rows.map(hotelEventToClient));
}

export async function POST(req: Request) {
  const gate_ = await requireStaff(req, "content:write");
  if (!gate_.ok) return gate_.response;
  try {
    const body = (await req.json()) as HotelEvent;
    const created = await prisma.hotelEvent.create({
      data: { hotelId: "default", ...hotelEventToDb(body) },
    });
    revalidateEvents();
    return NextResponse.json(hotelEventToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/events POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
