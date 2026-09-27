import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * v15 · Crypto rail via Coinbase Commerce hosted charges.
 *
 * The guest pays BTC/ETH/USDC on Coinbase's page; we get a hosted URL and a
 * signed webhook. Nothing about wallets touches our code. Enabled by
 * COINBASE_COMMERCE_KEY; COINBASE_WEBHOOK_SECRET verifies the callback.
 */

const API = "https://api.commerce.coinbase.com";

export function isCryptoConfigured(): boolean {
  return Boolean(process.env.COINBASE_COMMERCE_KEY?.trim());
}

export async function createCryptoCharge(input: {
  bookingId: string;
  bookingCode: string;
  amount: number;
  currency: string;
  description: string;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string }> {
  const res = await fetch(`${API}/charges`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-CC-Api-Key": process.env.COINBASE_COMMERCE_KEY!.trim(),
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: input.description,
      description: `Booking ${input.bookingCode}`,
      pricing_type: "fixed_price",
      local_price: { amount: input.amount.toFixed(2), currency: input.currency },
      metadata: { bookingId: input.bookingId, bookingCode: input.bookingCode },
      redirect_url: input.redirectUrl,
      cancel_url: input.cancelUrl,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`coinbase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { data: { id: string; hosted_url: string } };
  return { id: data.data.id, url: data.data.hosted_url };
}

export function verifyCoinbaseSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
