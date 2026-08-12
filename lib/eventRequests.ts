/**
 * v14 · Seat requests against a special event · client shape, mapper and the
 * validator shared by the guest form's server action and the API route.
 * No payment: this books a seat, the house confirms by phone or LINE.
 */
import type { ContactKind } from "@/lib/reservations";

export const EVENT_REQUEST_STATUSES = [
  "pending",
  "confirmed",
  "declined",
] as const;

export type EventRequestStatus = (typeof EVENT_REQUEST_STATUSES)[number];

export type EventRequest = {
  id: string;
  ref: string;
  eventId: string;
  eventTitle?: { en: string; th: string };
  eventDate?: string;
  name: string;
  contact: string;
  contactKind: ContactKind;
  guests: number;
  notes: string;
  status: EventRequestStatus;
  createdAt: string;
};

export type DbEventRequest = {
  id: string;
  ref: string;
  eventId: string;
  name: string;
  contact: string;
  contactKind: string;
  guests: number;
  notes: string;
  status: string;
  createdAt: Date;
  event?: {
    titleEn: string;
    titleTh: string;
    date: string;
  } | null;
};

export const MAX_EVENT_GUESTS = 12;

export function eventRequestToClient(r: DbEventRequest): EventRequest {
  return {
    id: r.id,
    ref: r.ref,
    eventId: r.eventId,
    eventTitle: r.event
      ? { en: r.event.titleEn, th: r.event.titleTh }
      : undefined,
    eventDate: r.event?.date,
    name: r.name,
    contact: r.contact,
    contactKind: r.contactKind === "line" ? "line" : "phone",
    guests: r.guests,
    notes: r.notes,
    status: (EVENT_REQUEST_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as EventRequestStatus)
      : "pending",
    createdAt: r.createdAt.toISOString(),
  };
}

export type EventRequestInput = {
  eventId: string;
  name: string;
  contact: string;
  contactKind: ContactKind;
  guests: number;
  notes?: string;
};

export type EventRequestError =
  | "event"
  | "name"
  | "contact"
  | "guests"
  | "failed";

export function validateEventRequest(
  input: EventRequestInput
): EventRequestError | null {
  if (!input.eventId.trim()) return "event";
  if (input.name.trim().length < 2) return "name";
  if (input.contact.trim().length < 4) return "contact";
  if (
    !Number.isInteger(input.guests) ||
    input.guests < 1 ||
    input.guests > MAX_EVENT_GUESTS
  ) {
    return "guests";
  }
  return null;
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** EVT- plus four characters · same no-look-alike alphabet as TBL refs. */
export function makeEventRef(): string {
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `EVT-${out}`;
}
