"use server";

import { redirect } from "next/navigation";
import {
  CONTACT_PURPOSES,
  normalizeContactExtras,
  validateContact,
  type ContactInput,
  type ContactPurpose,
} from "@/lib/contactMessages";
import { prisma } from "@/lib/db";

/**
 * Send a message · a server action, so the contact form posts and confirms
 * without JavaScript like the reservation flows.
 *
 * The redirect carries the purpose (so the form comes back on the right
 * setting) and nothing else. Name, contact details and the message itself are
 * never put in a URL.
 */
export async function sendMessage(formData: FormData) {
  const raw = String(formData.get("purpose") ?? "other");
  const purpose: ContactPurpose = (CONTACT_PURPOSES as readonly string[]).includes(
    raw
  )
    ? (raw as ContactPurpose)
    : "other";

  const partyRaw = String(formData.get("party") ?? "");
  const party = Number.parseInt(partyRaw, 10);

  const input: ContactInput = {
    purpose,
    name: String(formData.get("name") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    message: String(formData.get("message") ?? ""),
    checkIn: String(formData.get("checkIn") ?? ""),
    checkOut: String(formData.get("checkOut") ?? ""),
    date: String(formData.get("date") ?? ""),
    party: Number.isFinite(party) ? party : null,
  };

  const invalid = validateContact(input);
  if (invalid) {
    redirect(`/contact?about=${purpose}&error=${invalid}`);
  }

  try {
    await prisma.contactMessage.create({
      data: {
        purpose,
        name: input.name.trim(),
        contact: input.contact.trim(),
        message: input.message.trim(),
        ...normalizeContactExtras(input),
      },
    });
  } catch (e) {
    console.error("[contact action]", e);
    redirect(`/contact?about=${purpose}&error=failed`);
  }

  redirect(`/contact?sent=1`);
}
