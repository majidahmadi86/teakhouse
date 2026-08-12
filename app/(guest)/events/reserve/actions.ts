"use server";

import { redirect } from "next/navigation";
import { createEventRequest } from "@/lib/eventRequestService";
import type { ContactKind } from "@/lib/reservations";

/**
 * Request seats at an event · a server action, so it submits with JavaScript
 * disabled exactly like the table reservation flow.
 *
 * As with tables, the redirect carries back the error code and the event id
 * only. The guest's name and contact never go into a URL.
 */
export async function requestSeats(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const guestsRaw = String(formData.get("guests") ?? "");
  const guests = Number.parseInt(guestsRaw, 10);

  const result = await createEventRequest({
    eventId,
    name: String(formData.get("name") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    contactKind:
      String(formData.get("contactKind") ?? "phone") === "line"
        ? ("line" as ContactKind)
        : ("phone" as ContactKind),
    guests: Number.isFinite(guests) ? guests : 0,
    notes: String(formData.get("notes") ?? ""),
  });

  if (!result.ok) {
    const back = new URLSearchParams({ event: eventId, error: result.error });
    if (guestsRaw) back.set("guests", guestsRaw);
    redirect(`/events/reserve?${back.toString()}`);
  }

  const done = new URLSearchParams({
    ref: result.request.ref,
    guests: String(result.request.guests),
  });
  if (result.request.eventDate) done.set("date", result.request.eventDate);
  redirect(`/events/reserve?${done.toString()}`);
}
