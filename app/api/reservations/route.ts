import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createReservation } from "@/lib/reservationService";
import {
  reservationToClient,
  type ContactKind,
  type ReservationInput,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

/** Owner list · soonest first, then by time within the day. */
export async function GET() {
  const rows = await prisma.tableReservation.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(rows.map(reservationToClient));
}

export async function POST(req: Request) {
  let body: Partial<ReservationInput>;
  try {
    body = (await req.json()) as Partial<ReservationInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await createReservation({
    date: String(body.date ?? ""),
    time: String(body.time ?? ""),
    party: Number(body.party ?? 0),
    name: String(body.name ?? ""),
    contact: String(body.contact ?? ""),
    contactKind: (body.contactKind === "line" ? "line" : "phone") as ContactKind,
    notes: typeof body.notes === "string" ? body.notes : "",
  });

  if (!result.ok) {
    // "closed" is the owner having switched reservations off · not the guest's
    // mistake, and not a server error either.
    const status = result.error === "failed" ? 500 : result.error === "closed" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.reservation, { status: 201 });
}
