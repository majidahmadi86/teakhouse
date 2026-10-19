import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkAvailability, roomConflict } from "@/lib/availability";
import { sendBookingConfirmation } from "@/lib/bookingEmail";
import { confirmationPath, signBookingToken } from "@/lib/bookingToken";
import { generateBookingCode } from "@/lib/bookingUtils";
import { bookingToClient, bookingToDb } from "@/lib/mappers";
import { applyOffer, isOfferId, offerNote } from "@/lib/offers";
import type { Booking, BookingSource, BookingStatus } from "@/lib/ownerTypes";
import { requireOwner } from "@/lib/ownerSession";
import { quoteStay, toPriceRule } from "@/lib/pricing";
import { readOnlyResponse } from "@/lib/readOnly";
import { daysBetweenIso, hotelDayIso } from "@/lib/stayDate";

export const dynamic = "force-dynamic";

/** Owner list · PII, so owner session only (v18). */
export async function GET(req: Request) {
  const denied = requireOwner(req);
  if (denied) return denied;
  const rows = await prisma.booking.findMany({ orderBy: { checkIn: "desc" } });
  return NextResponse.json(rows.map(bookingToClient));
}

type PostBody = Partial<Booking> & {
  /** Owner only · save even though the room is taken or closed. */
  force?: boolean;
  /** Guest only · an offer id from /offers (lib/offers). */
  offer?: string;
  /** The guest's page language · the confirmation email follows it. */
  lang?: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^\S+@\S+\.\S+$/;
const STATUSES: BookingStatus[] = ["ok", "in", "out", "cancelled"];
const SOURCES: BookingSource[] = ["Direct", "Agoda", "Booking"];
const MAX_NIGHTS = 60;

function validIso(v: unknown): v is string {
  if (typeof v !== "string" || !ISO.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function count(v: unknown, max: number): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(0, Math.round(n)));
}

function bad(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

function newId(): string {
  return `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create a booking.
 *
 * Guests (no owner session): the price, status, source and code are the
 * server's to decide. The room must be free for every night (bookings and the
 * owner's closed nights, lib/availability checkAvailability) or the answer is
 * 409 with a message, and nothing is written. An offer from /offers is applied
 * here by its rule, never by a posted amount.
 *
 * The owner (valid owner session): records the booking as entered, including
 * a manual amount. A clash is answered 409 with the clashing booking, and the
 * owner may confirm and save anyway with { force: true }.
 */
export async function POST(req: Request) {
  const ro = readOnlyResponse();
  if (ro) return ro;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return bad("invalid", 400, { message: "The request could not be read." });
  }
  if (!body || typeof body !== "object") return bad("invalid");

  const isOwner = requireOwner(req) === null;
  const guest = String(body.guest ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 160);
  const phone = String(body.phone ?? "").trim().slice(0, 40);
  const roomSlug = String(body.roomSlug ?? "");
  const { checkIn, checkOut } = body;

  if (!guest) return bad("name", 400, { message: "A guest name is required." });
  if (!validIso(checkIn) || !validIso(checkOut) || checkOut <= checkIn) {
    return bad("dates", 400, { message: "Check-out must be after check-in." });
  }
  const nights = daysBetweenIso(checkIn, checkOut);
  if (nights > MAX_NIGHTS) return bad("dates", 400, { message: `Stays are limited to ${MAX_NIGHTS} nights.` });
  if (!isOwner) {
    if (!EMAIL.test(email)) return bad("email", 400, { message: "A valid email address is required." });
    if (phone.length < 6) return bad("phone", 400, { message: "A phone number is required." });
    if (checkIn < hotelDayIso()) return bad("dates", 400, { message: "Arrival cannot be in the past." });
  } else if (email && !EMAIL.test(email)) {
    return bad("email", 400, { message: "The email address is not valid." });
  }

  const room = await prisma.room.findUnique({
    where: { slug: roomSlug },
    select: { id: true, slug: true, rate: true, capacity: true, active: true },
  });
  if (!room) return bad("room", 400, { message: "That room does not exist." });

  const adults = count(body.adults, 20);
  const children = count(body.children, 20);
  if (!isOwner) {
    const people = (adults ?? 1) + (children ?? 0);
    if (people > room.capacity) {
      return bad("capacity", 400, { message: `This room sleeps ${room.capacity}.` });
    }
  }

  // Availability · the guest is refused, the owner is warned.
  if (isOwner) {
    if (!body.force) {
      const clash = await roomConflict(room.slug, checkIn, checkOut);
      if (clash.booking || clash.blockedNights.length) {
        return bad("overlap", 409, {
          message: clash.booking
            ? `This room is already booked (${clash.booking.code}) for some of these nights.`
            : "This room is closed for some of these nights.",
          conflict: clash,
        });
      }
    }
  } else {
    if (!room.active) {
      return bad("unavailable", 409, { message: "This room is not available for these dates." });
    }
    const availability = await checkAvailability(checkIn, checkOut);
    const mine = availability.rooms.find((r) => r.slug === room.slug);
    if (!mine || !mine.available) {
      return bad("unavailable", 409, {
        reason: mine?.reason ?? "booked",
        message: "This room has just been taken for these dates. Please choose another room or other dates.",
        alternatives: availability.alternatives,
      });
    }
  }

  // The price.
  const rules = await prisma.seasonalPriceRule.findMany({ where: { roomId: room.id } });
  const quoted = quoteStay(room.rate, checkIn, checkOut, rules.map(toPriceRule)).total;
  let amount = quoted;
  let notes = String(body.notes ?? "").slice(0, 2000);
  if (isOwner) {
    const manual = typeof body.amount === "number" ? Math.round(body.amount) : NaN;
    if (Number.isFinite(manual) && manual > 0) amount = manual;
  } else if (isOfferId(body.offer)) {
    const result = applyOffer(body.offer, quoted, checkIn, checkOut, hotelDayIso());
    if (result.eligible) {
      amount = result.total;
      const note = offerNote(result);
      notes = notes ? `${note}\n${notes}` : note;
    }
  }
  if (!(amount > 0)) return bad("amount", 400, { message: "The stay could not be priced." });

  const status: BookingStatus = isOwner && STATUSES.includes(body.status as BookingStatus) ? (body.status as BookingStatus) : "ok";
  const source: BookingSource = isOwner && SOURCES.includes(body.source as BookingSource) ? (body.source as BookingSource) : "Direct";
  const ownerCode = isOwner && typeof body.code === "string" && /^[A-Z]{2,4}-\d{3,6}$/.test(body.code) ? body.code : null;

  const base: Booking = {
    id: newId(),
    code: ownerCode ?? generateBookingCode(),
    guest,
    phone,
    email,
    roomSlug: room.slug,
    checkIn,
    checkOut,
    source,
    amount,
    status,
    notes,
    passportId: isOwner ? body.passportId?.trim() || undefined : undefined,
    nationality: isOwner ? body.nationality?.trim() || undefined : undefined,
    adults,
    children,
    arrivalTime: body.arrivalTime?.trim().slice(0, 20) || undefined,
    specialRequests: body.specialRequests?.trim().slice(0, 2000) || undefined,
  };

  // A short code can collide · mint another and try again.
  let created: Awaited<ReturnType<typeof prisma.booking.create>> | null = null;
  for (let attempt = 0; attempt < 6 && !created; attempt++) {
    try {
      const data = bookingToDb(attempt === 0 ? base : { ...base, id: newId(), code: generateBookingCode() });
      created = await prisma.booking.create({ data: { ...data, hotelId: "default" } });
    } catch (e) {
      const unique = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!unique) {
        console.error("[api/bookings POST]", e);
        return bad("failed", 500, { message: "The booking could not be saved." });
      }
    }
  }
  if (!created) return bad("failed", 500, { message: "The booking could not be saved." });

  // CRM guest row · best effort, never fails the booking.
  if (created.email) {
    try {
      const gid = `guest-${created.email.toLowerCase()}`;
      await prisma.guest.upsert({
        where: { id: gid },
        create: {
          id: gid,
          name: created.guest,
          email: created.email,
          phone: created.phone,
          passportId: created.passportId,
          nationality: created.nationality,
        },
        update: {
          name: created.guest,
          phone: created.phone,
          passportId: created.passportId,
          nationality: created.nationality,
        },
      });
    } catch (e) {
      console.error("[api/bookings] guest upsert failed", e);
    }
  }

  const token = created.email ? signBookingToken(created.id, created.email) : "";
  const confirmUrl = token ? confirmationPath(created.code, token) : "";

  // The confirmation email · in the guest's language, never fails the booking.
  if (created.email && confirmUrl) {
    try {
      await sendBookingConfirmation({
        bookingId: created.id,
        code: created.code,
        guest: created.guest,
        email: created.email,
        roomSlug: created.roomSlug,
        checkIn: created.checkIn,
        checkOut: created.checkOut,
        amount: created.amount,
        adults: created.adults,
        children: created.children,
        lang: body.lang === "th" ? "th" : "en",
        link: confirmUrl,
      });
    } catch (emailErr) {
      console.error("[api/bookings] confirmation email failed", emailErr);
    }
  }

  return NextResponse.json(
    { ...bookingToClient(created), confirmToken: token, confirmUrl },
    { status: 201 }
  );
}
