import { prisma } from "@/lib/db";
import { audit, type AuditActor } from "@/lib/audit";
import { getHotelId } from "@/lib/tenant";

/**
 * v15 · Service requests · the line between the concierge and the desk.
 *
 * A guest (or the AI on their behalf) asks for something; the desk sees it in
 * the operations view within seconds and moves it new → accepted → done.
 */

export type RequestKind =
  | "room_service"
  | "housekeeping"
  | "spa"
  | "transfer"
  | "dining"
  | "itinerary"
  | "other";

export const REQUEST_KINDS: RequestKind[] = [
  "room_service",
  "housekeeping",
  "spa",
  "transfer",
  "dining",
  "itinerary",
  "other",
];

export type RequestStatus = "new" | "accepted" | "done" | "cancelled";

export function isRequestKind(v: unknown): v is RequestKind {
  return typeof v === "string" && (REQUEST_KINDS as string[]).includes(v);
}

export function isRequestStatus(v: unknown): v is RequestStatus {
  return v === "new" || v === "accepted" || v === "done" || v === "cancelled";
}

export type ServiceRequestDto = {
  id: string;
  bookingId: string | null;
  bookingCode: string | null;
  guest: string | null;
  roomSlug: string | null;
  kind: RequestKind;
  title: string;
  details: string;
  due: string;
  status: RequestStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export function requestToClient(row: {
  id: string;
  bookingId: string | null;
  kind: string;
  title: string;
  details: string;
  due: string;
  status: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  booking?: { code: string; guest: string; roomSlug: string } | null;
}): ServiceRequestDto {
  return {
    id: row.id,
    bookingId: row.bookingId,
    bookingCode: row.booking?.code ?? null,
    guest: row.booking?.guest ?? null,
    roomSlug: row.booking?.roomSlug ?? null,
    kind: isRequestKind(row.kind) ? row.kind : "other",
    title: row.title,
    details: row.details,
    due: row.due,
    status: isRequestStatus(row.status) ? row.status : "new",
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createServiceRequest(
  input: {
    bookingCode?: string | null;
    bookingId?: string | null;
    kind: string;
    title: string;
    details?: string;
    due?: string;
    source: "guest" | "concierge_ai" | "staff";
  },
  actor: AuditActor
): Promise<ServiceRequestDto | { error: string }> {
  const title = input.title.trim().slice(0, 140);
  if (!title) return { error: "title required" };
  let bookingId = input.bookingId ?? null;
  if (!bookingId && input.bookingCode) {
    const b = await prisma.booking.findUnique({
      where: { code: input.bookingCode.trim().toUpperCase() },
      select: { id: true, status: true },
    });
    if (!b || b.status === "cancelled") return { error: "unknown booking" };
    bookingId = b.id;
  }
  const row = await prisma.serviceRequest.create({
    data: {
      hotelId: getHotelId(),
      bookingId,
      kind: isRequestKind(input.kind) ? input.kind : "other",
      title,
      details: (input.details ?? "").trim().slice(0, 2000),
      due: (input.due ?? "").trim().slice(0, 60),
      source: input.source,
    },
    include: { booking: { select: { code: true, guest: true, roomSlug: true } } },
  });
  await audit(actor, "request.created", "serviceRequest", row.id, { kind: row.kind, source: row.source });
  return requestToClient(row);
}

export async function listServiceRequests(opts: { status?: RequestStatus[]; limit?: number } = {}) {
  const rows = await prisma.serviceRequest.findMany({
    where: {
      hotelId: getHotelId(),
      ...(opts.status ? { status: { in: opts.status } } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: opts.limit ?? 100,
    include: { booking: { select: { code: true, guest: true, roomSlug: true } } },
  });
  return rows.map(requestToClient);
}
