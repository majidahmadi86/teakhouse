import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  RESERVATION_STATUSES,
  reservationToClient,
  type ReservationStatus,
} from "@/lib/reservations";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Owner edits · status is the field that moves; the rest is the guest's word. */
export async function PATCH(req: Request, { params }: Ctx) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const patch = (await req.json()) as {
      status?: string;
      notes?: string;
      party?: number;
      date?: string;
      time?: string;
    };
    const existing = await prisma.tableReservation.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (
      patch.status !== undefined &&
      !(RESERVATION_STATUSES as readonly string[]).includes(patch.status)
    ) {
      return NextResponse.json({ error: "Bad status" }, { status: 400 });
    }
    const updated = await prisma.tableReservation.update({
      where: { id: params.id },
      data: {
        status: (patch.status as ReservationStatus) ?? existing.status,
        notes: patch.notes ?? existing.notes,
        party:
          typeof patch.party === "number" && patch.party > 0
            ? patch.party
            : existing.party,
        date: patch.date ?? existing.date,
        time: patch.time ?? existing.time,
      },
    });
    return NextResponse.json(reservationToClient(updated));
  } catch (e) {
    console.error("[api/reservations PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    await prisma.tableReservation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/reservations DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
