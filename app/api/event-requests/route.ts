import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createEventRequest } from "@/lib/eventRequestService";
import {
  eventRequestToClient,
  type EventRequestInput,
} from "@/lib/eventRequests";
import type { ContactKind } from "@/lib/reservations";

export const dynamic = "force-dynamic";

/** Owner list · newest first, with the event each one belongs to. */
export async function GET() {
  const rows = await prisma.eventRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { event: { select: { titleEn: true, titleTh: true, date: true } } },
  });
  return NextResponse.json(rows.map(eventRequestToClient));
}

export async function POST(req: Request) {
  let body: Partial<EventRequestInput>;
  try {
    body = (await req.json()) as Partial<EventRequestInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await createEventRequest({
    eventId: String(body.eventId ?? ""),
    name: String(body.name ?? ""),
    contact: String(body.contact ?? ""),
    contactKind: (body.contactKind === "line" ? "line" : "phone") as ContactKind,
    guests: Number(body.guests ?? 0),
    notes: typeof body.notes === "string" ? body.notes : "",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "failed" ? 500 : 400 }
    );
  }
  return NextResponse.json(result.request, { status: 201 });
}
