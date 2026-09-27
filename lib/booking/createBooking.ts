import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit, type AuditActor } from "@/lib/audit";
import { generateBookingCode } from "@/lib/bookingUtils";
import { normaliseSelection, type AddonSelection } from "@/lib/addons";
import { enqueueOutbox, dispatchOutbox } from "@/lib/channels/outbox";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currencies";
import { eachNightIso } from "@/lib/pricing";
import { buildQuote, isQuoteError, validDates, type Quote } from "@/lib/quoteEngine";
import { getHotelId } from "@/lib/tenant";
import { hotelTodayIso } from "@/lib/utils";
import { sealIdentity } from "@/lib/vault";
import { sendBookingConfirmation } from "@/lib/booking/notify";

/**
 * v15 · The one way a booking gets created.
 *
 * Direct bookings, channel webhooks, the concierge and the front desk all come
 * through here, and the double-booking guard lives in exactly one place:
 *
 *   1. price with the authoritative engine (unless a channel sent its own price)
 *   2. inside a transaction, take a per-room advisory lock, recount the units
 *      free for every night of the stay from the rows as they are NOW, and
 *      refuse if none is left
 *   3. write the booking and its outbox event in that same transaction
 *
 * Two requests for the last unit race on the lock; the second one sees the
 * first one's row and gets `overbooked`. Postgres advisory locks are
 * transaction-scoped, so a crash releases them. On SQLite (local dev) there is
 * no advisory lock, and the single-writer database gives the same guarantee.
 */

export type CreateBookingInput = {
  guest: string;
  phone?: string;
  email?: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  adults?: number | null;
  children?: number | null;
  arrivalTime?: string | null;
  specialRequests?: string | null;
  notes?: string;
  passportId?: string | null;
  nationality?: string | null;
  /** "Direct" | "Agoda" | "Booking" | a channel name */
  source: string;
  addons?: AddonSelection[] | unknown;
  currency?: string;
  /** channel provenance */
  channelId?: string | null;
  externalRef?: string | null;
  /** A channel's own price · stored as-is; availability is still enforced. */
  trustedAmount?: number | null;
  status?: "ok" | "in";
  /** Client-suggested id/code (the demo receipt shows them before the round trip). */
  id?: string;
  code?: string;
};

export type CreateBookingResult =
  | { ok: true; booking: Prisma.BookingGetPayload<{}>; quote: Quote | null }
  | {
      ok: false;
      error: "invalid" | "room_not_found" | "overbooked" | "min_stay" | "past";
      detail?: string;
      quote?: Quote;
    };

export class OverbookedError extends Error {
  constructor() {
    super("overbooked");
  }
}

function isPostgres(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres");
}

function clean(s: unknown, max = 500): string {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

export async function createBooking(
  input: CreateBookingInput,
  actor: AuditActor
): Promise<CreateBookingResult> {
  const guest = clean(input.guest, 120);
  if (!guest) return { ok: false, error: "invalid", detail: "guest name required" };
  if (!validDates(input.checkIn, input.checkOut)) {
    return { ok: false, error: "invalid", detail: "checkOut must be after checkIn" };
  }

  const addons = normaliseSelection(input.addons);
  const currency: CurrencyCode = isCurrencyCode(input.currency) ? input.currency : "THB";
  const guests = Math.max(1, (input.adults ?? 2) + (input.children ?? 0));

  const quoted = await buildQuote({
    roomSlug: input.roomSlug,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests,
    addons,
    currency,
  });
  if (isQuoteError(quoted)) {
    return { ok: false, error: quoted.error === "room_not_found" ? "room_not_found" : "invalid" };
  }
  const trusted = typeof input.trustedAmount === "number" && input.trustedAmount > 0;
  if (!trusted) {
    if (quoted.blockedBy === "past") return { ok: false, error: "past", quote: quoted };
    if (quoted.blockedBy === "min_stay") return { ok: false, error: "min_stay", quote: quoted };
  }

  const identityVault = sealIdentity({
    passportId: input.passportId,
    nationality: input.nationality,
  });

  const hotelId = getHotelId();
  const nights = eachNightIso(input.checkIn, input.checkOut);
  const room = quoted.room;

  let created: Prisma.BookingGetPayload<{}> | null = null;

  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    const id = input.id && attempt === 0 ? input.id : `bk-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const code = input.code && attempt === 0 ? input.code : generateBookingCode();
    try {
      created = await prisma.$transaction(
        async (tx) => {
          if (isPostgres()) {
            // Serialise writers for this room type · released with the transaction.
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${room.slug}))`;
          }
          const overlapping = await tx.booking.findMany({
            where: {
              roomSlug: room.slug,
              status: { not: "cancelled" },
              checkIn: { lt: input.checkOut },
              checkOut: { gt: input.checkIn },
            },
            select: { checkIn: true, checkOut: true },
          });
          const blocks = await tx.roomBlock.findMany({
            where: { roomId: room.id, dateIso: { in: nights } },
            select: { dateIso: true },
          });
          if (blocks.length > 0) throw new OverbookedError();
          const units = Math.max(1, room.units);
          for (const night of nights) {
            const sold = overlapping.filter((b) => b.checkIn <= night && b.checkOut > night).length;
            if (sold >= units) throw new OverbookedError();
          }

          const row = await tx.booking.create({
            data: {
              id,
              hotelId,
              code,
              guest,
              phone: clean(input.phone, 60),
              email: clean(input.email, 160).toLowerCase(),
              roomSlug: room.slug,
              checkIn: input.checkIn,
              checkOut: input.checkOut,
              source: clean(input.source, 40) || "Direct",
              amount: trusted ? Math.round(input.trustedAmount!) : quoted.roomTotal,
              status: input.status ?? "ok",
              notes: clean(input.notes, 2000),
              passportId: identityVault ? null : clean(input.passportId, 60) || null,
              nationality: identityVault ? null : clean(input.nationality, 60) || null,
              adults: input.adults ?? null,
              children: input.children ?? null,
              arrivalTime: clean(input.arrivalTime, 20) || null,
              specialRequests: clean(input.specialRequests, 2000) || null,
              currency,
              fxRate: quoted.display.rate,
              packages: JSON.stringify(addons),
              packagesAmount: quoted.addonsTotal,
              channelId: input.channelId ?? null,
              externalRef: input.externalRef ?? null,
              vault: identityVault ?? "",
            },
          });

          await enqueueOutbox(tx, "availability.changed", `avail:${row.id}:create`, {
            roomId: room.id,
            roomSlug: room.slug,
            dates: nights,
            reason: "booking.created",
            bookingId: row.id,
          });
          return row;
        },
        { timeout: 15000 }
      );
    } catch (e) {
      if (e instanceof OverbookedError) {
        await audit(actor, "booking.refused.overbooked", "booking", "", {
          roomSlug: room.slug,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          source: input.source,
        });
        return { ok: false, error: "overbooked", quote: quoted };
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        // Unique clash on id/code · try again with fresh ones.
        if (attempt === 2) throw e;
        continue;
      }
      throw e;
    }
  }

  if (!created) return { ok: false, error: "invalid", detail: "could not allocate a booking code" };

  await audit(actor, "booking.created", "booking", created.id, {
    code: created.code,
    roomSlug: created.roomSlug,
    checkIn: created.checkIn,
    checkOut: created.checkOut,
    amount: created.amount,
    source: created.source,
  });

  // CRM row · best effort.
  if (created.email) {
    const gid = `guest-${created.email.toLowerCase()}`;
    await prisma.guest
      .upsert({
        where: { id: gid },
        create: {
          id: gid,
          name: created.guest,
          email: created.email,
          phone: created.phone,
          nationality: created.nationality,
        },
        update: { name: created.guest, phone: created.phone },
      })
      .catch((e) => console.error("[createBooking] guest upsert", e));
  }

  await sendBookingConfirmation(created).catch((e) =>
    console.error("[createBooking] confirmation", e)
  );
  await dispatchOutbox({ budgetMs: 2500 }).catch((e) =>
    console.error("[createBooking] outbox dispatch", e)
  );

  return { ok: true, booking: created, quote: quoted };
}

/** Cancel + release inventory + tell the channels. */
export async function cancelBooking(
  bookingId: string,
  actor: AuditActor,
  reason = ""
): Promise<Prisma.BookingGetPayload<{}> | null> {
  const row = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!row || row.status === "cancelled") return row;
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
    });
    await enqueueOutbox(tx, "availability.changed", `avail:${bookingId}:cancel:${Date.now()}`, {
      roomSlug: u.roomSlug,
      dates: eachNightIso(u.checkIn, u.checkOut),
      reason: "booking.cancelled",
      bookingId,
    });
    return u;
  });
  await audit(actor, "booking.cancelled", "booking", bookingId, { reason });
  await dispatchOutbox({ budgetMs: 2500 }).catch(() => undefined);
  return updated;
}

export { hotelTodayIso };
