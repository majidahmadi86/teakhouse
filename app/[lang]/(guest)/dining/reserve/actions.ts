"use server";

import { redirect } from "next/navigation";
import { createReservation } from "@/lib/reservationService";
import type { ContactKind } from "@/lib/reservations";

/**
 * Reserve a table · a server action, so the form works with JavaScript
 * disabled (real POST, server redirect) and upgrades to a client transition
 * when React is present. One code path, no duplicate client validator.
 *
 * On failure the redirect carries back the error code and the non-personal
 * fields only. The guest's name and phone number are never put in a URL.
 */
export async function reserveTable(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const partyRaw = String(formData.get("party") ?? "");
  const party = Number.parseInt(partyRaw, 10);
  const name = String(formData.get("name") ?? "");
  const contact = String(formData.get("contact") ?? "");
  const contactKind: ContactKind =
    String(formData.get("contactKind") ?? "phone") === "line" ? "line" : "phone";
  const notes = String(formData.get("notes") ?? "");

  const result = await createReservation({
    date,
    time,
    party: Number.isFinite(party) ? party : 0,
    name,
    contact,
    contactKind,
    notes,
  });

  const keep = new URLSearchParams();
  if (!result.ok) {
    keep.set("error", result.error);
    if (date) keep.set("date", date);
    if (time) keep.set("time", time);
    if (partyRaw) keep.set("party", partyRaw);
    redirect(`/dining/reserve?${keep.toString()}`);
  }

  const done = new URLSearchParams({
    ref: result.reservation.ref,
    date: result.reservation.date,
    time: result.reservation.time,
    party: String(result.reservation.party),
  });
  redirect(`/dining/reserve?${done.toString()}`);
}
