import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  bookingIds: string[];
};

function toApi(
  u: {
    id: string;
    name: string;
    email: string;
    bookings: { bookingId: string }[];
  }
): ApiUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    bookingIds: u.bookings.map((b) => b.bookingId),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");

  if (id) {
    const u = await prisma.user.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toApi(u));
  }

  if (email) {
    const u = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { bookings: true },
    });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toApi(u));
  }

  const users = await prisma.user.findMany({ include: { bookings: true } });
  return NextResponse.json(users.map(toApi));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action: "signup" | "signin" | "attach" | "update";
      name?: string;
      email?: string;
      password?: string;
      bookingId?: string;
      userId?: string;
      patch?: { name?: string; email?: string };
    };

    if (body.action === "signup") {
      const trimmedEmail = (body.email ?? "").trim().toLowerCase();
      const trimmedName = (body.name ?? "").trim();
      const password = body.password ?? "";
      if (!trimmedName || !trimmedEmail || !password) {
        return NextResponse.json({ error: "missing" }, { status: 400 });
      }
      const exists = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (exists) {
        return NextResponse.json({ error: "exists" }, { status: 409 });
      }
      const id = `gu-${Date.now()}`;
      const u = await prisma.user.create({
        data: {
          id,
          name: trimmedName,
          email: trimmedEmail,
          password,
          bookings: body.bookingId
            ? { create: [{ bookingId: body.bookingId }] }
            : undefined,
        },
        include: { bookings: true },
      });
      return NextResponse.json(toApi(u), { status: 201 });
    }

    if (body.action === "signin") {
      const trimmedEmail = (body.email ?? "").trim().toLowerCase();
      const u = await prisma.user.findFirst({
        where: { email: trimmedEmail, password: body.password ?? "" },
        include: { bookings: true },
      });
      if (!u) {
        return NextResponse.json({ error: "invalid" }, { status: 401 });
      }
      return NextResponse.json(toApi(u));
    }

    if (body.action === "attach") {
      const userId = body.userId;
      const bookingId = body.bookingId;
      if (!userId || !bookingId) {
        return NextResponse.json({ error: "missing" }, { status: 400 });
      }
      await prisma.guestBooking.upsert({
        where: {
          userId_bookingId: { userId, bookingId },
        },
        create: { userId, bookingId },
        update: {},
      });
      const u = await prisma.user.findUnique({
        where: { id: userId },
        include: { bookings: true },
      });
      return NextResponse.json(u ? toApi(u) : null);
    }

    if (body.action === "update") {
      const userId = body.userId;
      if (!userId || !body.patch) {
        return NextResponse.json({ error: "missing" }, { status: 400 });
      }
      const data: { name?: string; email?: string } = {};
      if (body.patch.name) data.name = body.patch.name.trim();
      if (body.patch.email) data.email = body.patch.email.trim().toLowerCase();
      const u = await prisma.user.update({
        where: { id: userId },
        data,
        include: { bookings: true },
      });
      return NextResponse.json(toApi(u));
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[api/users]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
