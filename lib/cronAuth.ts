import { createHash, timingSafeEqual } from "crypto";

/**
 * HF-1 · The reseed cron fails closed.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` by itself once
 * CRON_SECRET is set in the project env. The route used to check the bearer
 * only when the secret was set, so with it unset any anonymous GET wiped and
 * rewrote the database. Now every case that is not exactly the right bearer
 * is refused, an unset or empty CRON_SECRET included.
 *
 * Both sides are hashed before the compare so the check takes the same time
 * whatever the length or content of the header a caller sends.
 */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return false;
  const got = createHash("sha256")
    .update(req.headers.get("authorization") ?? "")
    .digest();
  const want = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(got, want);
}
