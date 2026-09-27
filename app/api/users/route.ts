import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gate, isDenied } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * v15 · Guest accounts · STAFF listing only.
 *
 * Sign-up, sign-in and "my bookings" moved to /api/account/*, where the
 * session is an HttpOnly cookie. The old GET ?id= answered for any id typed
 * into the URL · a guest account was one guessable timestamp away.
 */
export async function GET(req: Request) {
  const g = await gate(req, "guests:read");
  if (isDenied(g)) return g.denied;
  const users = await prisma.user.findMany({
    include: { bookings: { select: { bookingId: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      bookingIds: u.bookings.map((b) => b.bookingId),
      createdAt: u.createdAt.toISOString(),
    }))
  );
}
