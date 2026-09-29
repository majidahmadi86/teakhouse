import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  EVENT_REQUEST_STATUSES,
  eventRequestToClient,
  type EventRequestStatus,
} from "@/lib/eventRequests";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const patch = (await req.json()) as { status?: string; notes?: string };
    if (
      patch.status !== undefined &&
      !(EVENT_REQUEST_STATUSES as readonly string[]).includes(patch.status)
    ) {
      return NextResponse.json({ error: "Bad status" }, { status: 400 });
    }
    const existing = await prisma.eventRequest.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.eventRequest.update({
      where: { id: params.id },
      data: {
        status: (patch.status as EventRequestStatus) ?? existing.status,
        notes: patch.notes ?? existing.notes,
      },
      include: { event: { select: { titleEn: true, titleTh: true, date: true } } },
    });
    return NextResponse.json(eventRequestToClient(updated));
  } catch (e) {
    console.error("[api/event-requests PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await prisma.eventRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/event-requests DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
