import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * v15 · Stripe · hosted Checkout, no SDK, no card data on our pages.
 *
 * PCI: the guest is redirected to Stripe's page (SAQ-A scope). Cards, Apple
 * Pay, Google Pay and Stripe's own PromptPay all live there. Our side holds a
 * session id and a signed webhook · never a PAN. Enabled by STRIPE_SECRET_KEY;
 * STRIPE_WEBHOOK_SECRET verifies what comes back.
 */

const API = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function form(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/** Currencies Stripe charges in minor units of 100 · THB and most others; JPY/KRW have none. */
function minorUnits(currency: string, amount: number): number {
  const zeroDecimal = ["JPY", "KRW"];
  return zeroDecimal.includes(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);
}

export type CheckoutInput = {
  bookingId: string;
  bookingCode: string;
  amount: number;
  currency: string;
  description: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckoutSession(
  input: CheckoutInput
): Promise<{ id: string; url: string }> {
  const key = process.env.STRIPE_SECRET_KEY!.trim();
  const body: Record<string, string> = {
    mode: "payment",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(minorUnits(input.currency, input.amount)),
    "line_items[0][price_data][product_data][name]": input.description,
    "line_items[0][quantity]": "1",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.bookingId,
    "metadata[bookingId]": input.bookingId,
    "metadata[bookingCode]": input.bookingCode,
    "payment_intent_data[metadata][bookingId]": input.bookingId,
  };
  if (input.email) body.customer_email = input.email;
  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}

/** Verify a `Stripe-Signature` header against the raw body · the v1 scheme. */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSec = 300
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  ) as Record<string, string | undefined>;
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
