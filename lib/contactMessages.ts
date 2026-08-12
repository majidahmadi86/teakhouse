/**
 * v14 · Contact messages · one form, four purposes. The purpose decides which
 * single extra field is asked for, so the guest never sees more than five
 * inputs at once.
 */

export const CONTACT_PURPOSES = ["stay", "dining", "event", "other"] as const;
export type ContactPurpose = (typeof CONTACT_PURPOSES)[number];

/** Which extra field each purpose adds · "none" keeps the form at four. */
export const PURPOSE_EXTRA: Record<ContactPurpose, "stay" | "when" | "none"> = {
  stay: "stay", // check-in + check-out (one date-range field)
  dining: "when", // date + party
  event: "when", // date + party
  other: "none",
};

export type ContactMessage = {
  id: string;
  purpose: ContactPurpose;
  name: string;
  contact: string;
  message: string;
  checkIn: string;
  checkOut: string;
  date: string;
  party: number | null;
  status: "new" | "read" | "done";
  createdAt: string;
};

export type DbContactMessage = {
  id: string;
  purpose: string;
  name: string;
  contact: string;
  message: string;
  checkIn: string;
  checkOut: string;
  date: string;
  party: number | null;
  status: string;
  createdAt: Date;
};

export function contactMessageToClient(m: DbContactMessage): ContactMessage {
  const purpose = (CONTACT_PURPOSES as readonly string[]).includes(m.purpose)
    ? (m.purpose as ContactPurpose)
    : "other";
  const status =
    m.status === "read" || m.status === "done"
      ? (m.status as "read" | "done")
      : "new";
  return {
    id: m.id,
    purpose,
    name: m.name,
    contact: m.contact,
    message: m.message,
    checkIn: m.checkIn,
    checkOut: m.checkOut,
    date: m.date,
    party: m.party,
    status,
    createdAt: m.createdAt.toISOString(),
  };
}

export type ContactInput = {
  purpose: ContactPurpose;
  name: string;
  contact: string;
  message: string;
  checkIn?: string;
  checkOut?: string;
  date?: string;
  party?: number | null;
};

export type ContactError = "name" | "contact" | "message" | "failed";

export function validateContact(input: ContactInput): ContactError | null {
  if (input.name.trim().length < 2) return "name";
  if (input.contact.trim().length < 4) return "contact";
  if (input.message.trim().length < 4) return "message";
  return null;
}

/** Purpose-specific extras are optional · a guest who skips them still gets through. */
export function normalizeContactExtras(input: ContactInput) {
  const extra = PURPOSE_EXTRA[input.purpose];
  const iso = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  return {
    checkIn: extra === "stay" ? iso(input.checkIn) : "",
    checkOut: extra === "stay" ? iso(input.checkOut) : "",
    date: extra === "when" ? iso(input.date) : "",
    party:
      extra === "when" &&
      typeof input.party === "number" &&
      Number.isInteger(input.party) &&
      input.party > 0 &&
      input.party <= 99
        ? input.party
        : null,
  };
}
