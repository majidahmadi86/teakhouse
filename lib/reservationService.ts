/**
 * v13 · Reservation writes · one code path for both entry points (the guest
 * form's server action and POST /api/reservations), so the rules cannot drift
 * between them.
 */
import { prisma } from "@/lib/db";
import { getReservationSettings } from "@/lib/hotelSettings";
import {
  makeReservationRef,
  reservationToClient,
  validateReservation,
  type ReservationInput,
  type TableReservation,
  type ValidationError,
} from "@/lib/reservations";
import { hotelTodayIso } from "@/lib/utils";

export type CreateResult =
  | { ok: true; reservation: TableReservation }
  | { ok: false; error: ValidationError | "failed" };

export async function createReservation(
  input: ReservationInput
): Promise<CreateResult> {
  const settings = await getReservationSettings();
  // The hotel's day decides whether a date is in the past · not the
  // server's. These two differ for seven hours of every Bangkok day.
  const invalid = validateReservation(input, settings, hotelTodayIso());
  if (invalid) return { ok: false, error: invalid };

  // The ref is short and human-readable, so a collision is possible rather
  // than unthinkable · retry a few times before giving up.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma.tableReservation.create({
        data: {
          hotelId: "default",
          ref: makeReservationRef(),
          date: input.date,
          time: input.time,
          party: input.party,
          name: input.name.trim(),
          contact: input.contact.trim(),
          contactKind: input.contactKind,
          notes: (input.notes ?? "").trim(),
          status: "pending",
        },
      });
      return { ok: true, reservation: reservationToClient(row) };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "P2002") continue;
      console.error("[reservationService] create", e);
      return { ok: false, error: "failed" };
    }
  }
  return { ok: false, error: "failed" };
}

/**
 * There is deliberately no lookup-by-ref here. TBL-XXXX is four characters, so
 * a ref endpoint would be an enumerable handle to a row holding a guest's name
 * and phone number. The confirmation screen renders from what the guest just
 * submitted instead, and the owner panel reads the list behind the owner gate.
 */
