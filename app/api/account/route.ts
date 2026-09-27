import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, GUEST } from "@/lib/audit";
import { bad, readJson } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearedGuestCookie, getGuestUserId, guestCookie } from "@/lib/auth/session";
import { cancelBooking } from "@/lib/booking/createBooking";
import { bookingToClient } from "@/lib/mappers";
import { limitOrReject } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * v15 · The guest account API · one route, one HttpOnly cookie.
 *
 *   GET            · who am I + my bookings (401 when not signed in)
 *   POST signup    · create account (password hashed), sign in, optional booking attach
 *   POST signin    · verify (upgrading a legacy plaintext row to a hash), sign in
 *   POST signout   · clear the cookie
 *   POST attach    · link a booking I just made to my account
 *   POST update    · change my name/email
 *   POST cancel    · cancel one of MY bookings (free-cancellation window enforced)
 */

type Body = {
  action?: "signup" | "signin" | "signout" | "attach" | "update" | "cancel";
  name?: string;
  email?: string;
  password?: string;
  bookingId?: string;
  patch?: { name?: string; email?: string };
};

async function me(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { bookings: { include: { booking: true } } },
  });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    bookingIds: u.bookings.map((b) => b.bookingId),
    bookings: u.bookings
      .map((b) => bookingToClient(b.booking))
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
  };
}

export async function GET(req: Request) {
  const uid = getGuestUserId(req);
  if (!uid) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const user = await me(uid);
  if (!user) {
    const res = NextResponse.json({ error: "not signed in" }, { status: 401 });
    res.cookies.set(clearedGuestCookie());
    return res;
  }
  return NextResponse.json(user);
}

export async function POST(req: Request) {
  const body = (await readJson<Body>(req)) ?? {};
  const uid = getGuestUserId(req);

  if (body.action === "signup") {
    const limited = limitOrReject(req, "auth");
    if (limited) return limited;
    const email = (body.email ?? "").trim().toLowerCase();
    const name = (body.name ?? "").trim().slice(0, 120);
    const password = body.password ?? "";
    if (!name || !email || password.length < 6) return bad("missing");
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });
    const u = await prisma.user.create({
      data: {
        id: `gu-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
        name,
        email,
        password: hashPassword(password),
        bookings: body.bookingId ? { create: [{ bookingId: body.bookingId }] } : undefined,
      },
    });
    await audit(GUEST, "guest.signup", "user", u.id);
    const res = NextResponse.json(await me(u.id), { status: 201 });
    res.cookies.set(guestCookie(u.id));
    return res;
  }

  if (body.action === "signin") {
    const limited = limitOrReject(req, "auth");
    if (limited) return limited;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password) return bad("missing");
    const u = await prisma.user.findUnique({ where: { email } });
    const check = u ? verifyPassword(password, u.password) : { ok: false, upgrade: false };
    if (!u || !check.ok) return NextResponse.json({ error: "invalid" }, { status: 401 });
    if (check.upgrade) {
      await prisma.user.update({ where: { id: u.id }, data: { password: hashPassword(password) } });
    }
    const res = NextResponse.json(await me(u.id));
    res.cookies.set(guestCookie(u.id));
    return res;
  }

  if (body.action === "signout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(clearedGuestCookie());
    return res;
  }

  if (!uid) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  if (body.action === "attach") {
    if (!body.bookingId) return bad("missing");
    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId }, select: { id: true } });
    if (!booking) return bad("unknown booking", 404);
    await prisma.guestBooking.upsert({
      where: { userId_bookingId: { userId: uid, bookingId: body.bookingId } },
      create: { userId: uid, bookingId: body.bookingId },
      update: {},
    });
    return NextResponse.json(await me(uid));
  }

  if (body.action === "update") {
    const data: { name?: string; email?: string } = {};
    if (body.patch?.name?.trim()) data.name = body.patch.name.trim().slice(0, 120);
    if (body.patch?.email?.trim()) data.email = body.patch.email.trim().toLowerCase();
    try {
      await prisma.user.update({ where: { id: uid }, data });
    } catch {
      return NextResponse.json({ error: "exists" }, { status: 409 });
    }
    return NextResponse.json(await me(uid));
  }

  if (body.action === "cancel") {
    if (!body.bookingId) return bad("missing");
    const link = await prisma.guestBooking.findUnique({
      where: { userId_bookingId: { userId: uid, bookingId: body.bookingId } },
    });
    if (!link) return bad("not your booking", 403);
    await cancelBooking(body.bookingId, GUEST, "guest");
    return NextResponse.json(await me(uid));
  }

  return bad("Unknown action");
}
