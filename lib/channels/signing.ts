import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * v15 · Webhook signing · both directions use the same scheme.
 *
 *   x-tkh-timestamp: <unix seconds>
 *   x-tkh-signature: sha256=<hex hmac of "<timestamp>.<raw body>">
 *
 * The timestamp is part of the signed string, so a captured request cannot be
 * replayed after the tolerance window even with the body intact.
 */

export const SIGNATURE_HEADER = "x-tkh-signature";
export const TIMESTAMP_HEADER = "x-tkh-timestamp";
const TOLERANCE_SEC = 5 * 60;

export function sign(secret: string, rawBody: string, timestamp = Math.floor(Date.now() / 1000)) {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return { timestamp: String(timestamp), signature: `sha256=${mac}` };
}

export function verify(
  secret: string,
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  now = Math.floor(Date.now() / 1000)
): { ok: boolean; reason?: string } {
  if (!signature || !timestamp) return { ok: false, reason: "missing signature" };
  if (!/^\d+$/.test(timestamp)) return { ok: false, reason: "bad timestamp" };
  if (Math.abs(now - Number(timestamp)) > TOLERANCE_SEC) return { ok: false, reason: "stale timestamp" };
  const expected = sign(secret, rawBody, Number(timestamp)).signature;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "signature mismatch" };
  return { ok: true };
}
