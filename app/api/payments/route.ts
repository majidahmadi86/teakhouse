import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GUEST } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { isRail, railAvailability, settlePayment, startPayment } from "@/lib/payments";
import { limitOrReject } from "@/lib/rateLimit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * v15 · Payments.
 *
 *   GET                       · which rails are live vs demo
 *   POST { action: "start" }  · begin a payment for a booking (deposit or full)
 *   POST { action: "confirm" }· STAFF · mark a wire / PromptPay payment received
 *   POST { action: "list" }   · STAFF · payments for a booking
 */

type Body = {
  action?: "start" | "confirm" | "list";
  bookingId?: string;
  rail?: string;
  scope?: "deposit" | "full";
  currency?: string;
  paymentId?: string;
  reference?: string;
};

export async function GET() {
  return NextResponse.json(await railAvailability());
}

export async function POST(req: Request) {
  const body = (await readJson<Body>(req)) ?? {};

  if (body.action === "start") {
    const limited = limitOrReject(req, "booking");
    if (limited) return limited;
    if (!body.bookingId || !isRail(body.rail)) return bad("bookingId and rail are required");
    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!booking) return bad("unknown booking", 404);
    const hotel = await prisma.hotel.findUnique({ where: { id: "default" }, select: { depositPct: true } });
    const total = booking.amount + booking.packagesAmount;
    const due = Math.max(0, total - booking.paidAmount);
    const deposit = Math.round((total * (hotel?.depositPct ?? 30)) / 100);
    const amountThb = body.scope === "full" ? due : Math.min(due, deposit);
    if (amountThb <= 0) return NextResponse.json({ kind: "settled", paid: booking.paidAmount });
    const base = SITE_URL.replace(/\/$/, "");
    try {
      const result = await startPayment(
        {
          bookingId: booking.id,
          rail: body.rail,
          amountThb,
          currency: body.currency,
          returnUrl: `${base}/book?paid=${encodeURIComponent(booking.code)}`,
          cancelUrl: `${base}/book?cancelled=${encodeURIComponent(booking.code)}`,
        },
        GUEST
      );
      return NextResponse.json(result);
    } catch (e) {
      console.error("[api/payments start]", e);
      return NextResponse.json({ error: "Payment could not be started" }, { status: 502 });
    }
  }

  const g = await gate(req, "payments:read");
  if (isDenied(g)) return g.denied;

  if (body.action === "confirm") {
    if (!body.paymentId) return bad("paymentId required");
    await settlePayment(body.paymentId, body.reference?.trim() || "manual", g.actor, { by: g.actor.id });
    const payment = await prisma.payment.findUnique({ where: { id: body.paymentId }, include: { booking: true } });
    return NextResponse.json({ ok: true, booking: payment?.booking.paymentStatus, paid: payment?.booking.paidAmount });
  }

  if (body.action === "list") {
    if (!body.bookingId) return bad("bookingId required");
    const rows = await prisma.payment.findMany({ where: { bookingId: body.bookingId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), paidAt: p.paidAt?.toISOString() ?? null })));
  }

  return bad("Unknown action");
}
