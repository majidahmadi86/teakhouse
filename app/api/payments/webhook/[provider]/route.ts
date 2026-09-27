import { NextResponse } from "next/server";
import { verifyCoinbaseSignature } from "@/lib/payments/crypto";
import { settleByProviderRef } from "@/lib/payments";
import { verifyStripeSignature } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";

type Ctx = { params: { provider: string } };

/**
 * v15 · Provider callbacks · signature first, then settle by reference.
 * Idempotent: settling an already-settled payment is a no-op.
 */
export async function POST(req: Request, { params }: Ctx) {
  const raw = await req.text();

  if (params.provider === "stripe") {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
    if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
    const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_intent?: string } } };
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const ok = await settleByProviderRef("stripe", event.data.object.id, {
        paymentIntent: event.data.object.payment_intent ?? "",
        event: event.type,
      });
      return NextResponse.json({ received: true, settled: ok });
    }
    return NextResponse.json({ received: true, ignored: event.type });
  }

  if (params.provider === "crypto") {
    const secret = process.env.COINBASE_WEBHOOK_SECRET?.trim();
    if (!secret) return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
    if (!verifyCoinbaseSignature(raw, req.headers.get("x-cc-webhook-signature"), secret)) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
    const event = JSON.parse(raw) as { event: { type: string; data: { id: string } } };
    if (event.event.type === "charge:confirmed" || event.event.type === "charge:resolved") {
      const ok = await settleByProviderRef("crypto", event.event.data.id, { event: event.event.type });
      return NextResponse.json({ received: true, settled: ok });
    }
    return NextResponse.json({ received: true, ignored: event.event.type });
  }

  return NextResponse.json({ error: "unknown provider" }, { status: 404 });
}
