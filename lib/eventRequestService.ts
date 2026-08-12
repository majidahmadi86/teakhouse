/**
 * v14 · Event seat request writes · one path for the guest form's server action
 * and the API route, so both are held to the same rules.
 */
import { prisma } from "@/lib/db";
import {
  eventRequestToClient,
  makeEventRef,
  validateEventRequest,
  type EventRequest,
  type EventRequestError,
  type EventRequestInput,
} from "@/lib/eventRequests";

export type CreateEventRequestResult =
  | { ok: true; request: EventRequest }
  | { ok: false; error: EventRequestError };

export async function createEventRequest(
  input: EventRequestInput
): Promise<CreateEventRequestResult> {
  const invalid = validateEventRequest(input);
  if (invalid) return { ok: false, error: invalid };

  // The event must exist and be published · a request against a hidden or
  // deleted event would land in the list with nothing to attach it to.
  const event = await prisma.hotelEvent
    .findFirst({
      where: { id: input.eventId, published: true },
      select: { id: true },
    })
    .catch(() => null);
  if (!event) return { ok: false, error: "event" };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma.eventRequest.create({
        data: {
          ref: makeEventRef(),
          eventId: input.eventId,
          name: input.name.trim(),
          contact: input.contact.trim(),
          contactKind: input.contactKind,
          guests: input.guests,
          notes: (input.notes ?? "").trim(),
          status: "pending",
        },
        include: { event: { select: { titleEn: true, titleTh: true, date: true } } },
      });
      return { ok: true, request: eventRequestToClient(row) };
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue;
      console.error("[eventRequestService] create", e);
      return { ok: false, error: "failed" };
    }
  }
  return { ok: false, error: "failed" };
}
