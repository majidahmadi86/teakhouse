import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * v18 · The confirmation link's proof of ownership.
 *
 * /book/confirmed/<code>?t=<token> must never open a booking by its code
 * alone (codes are short and guessable). The token is an HMAC of the booking
 * id and the guest's email, so only the browser that made the booking (it is
 * handed the token in the 201 response) and the guest's own confirmation
 * email can open the page.
 *
 * The key comes from CRON_SECRET, the same server secret the owner session is
 * signed with. A server without it falls back to DATABASE_URL, which is
 * always present and never public, so a link can always be issued and checked.
 */
const LABEL = "tkh-booking-confirmation-v1";

function key(): Buffer {
  const secret =
    process.env.CRON_SECRET ||
    process.env.DATABASE_URL ||
    "teakhouse-LOCAL-DEV-ONLY-not-a-secret";
  return createHmac("sha256", secret).update(LABEL).digest();
}

export function signBookingToken(bookingId: string, email: string): string {
  return createHmac("sha256", key())
    .update(`${bookingId}\n${email.trim().toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyBookingToken(
  bookingId: string,
  email: string,
  token: string | null | undefined
): boolean {
  if (!token || typeof token !== "string" || token.length > 64) return false;
  const expected = signBookingToken(bookingId, email);
  const a = createHash("sha256").update(token).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The guest-facing confirmation path for a booking. */
export function confirmationPath(code: string, token: string): string {
  return `/book/confirmed/${encodeURIComponent(code)}?t=${encodeURIComponent(token)}`;
}
