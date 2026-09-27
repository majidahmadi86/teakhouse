import { NextResponse } from "next/server";

/**
 * v15 · Sliding-window rate limit, in memory.
 *
 * Serverless instances are short-lived, so this is a burst brake rather than
 * a global quota: it stops one client hammering sign-in, the concierge or the
 * booking endpoint from a single function instance, at zero cost. Put a
 * platform limiter (Vercel WAF, Cloudflare) in front for the global number.
 */

type Bucket = number[];
const buckets = new Map<string, Bucket>();
let sweepAt = Date.now();

export type LimitRule = { limit: number; windowMs: number };

export const LIMITS = {
  auth: { limit: 10, windowMs: 5 * 60_000 },
  concierge: { limit: 30, windowMs: 60_000 },
  booking: { limit: 12, windowMs: 60_000 },
  webhook: { limit: 240, windowMs: 60_000 },
  quote: { limit: 120, windowMs: 60_000 },
} satisfies Record<string, LimitRule>;

function sweep(now: number) {
  if (now - sweepAt < 60_000) return;
  sweepAt = now;
  buckets.forEach((hits, key) => {
    if (hits.length === 0 || hits[hits.length - 1] < now - 10 * 60_000) buckets.delete(key);
  });
}

export function rateLimit(
  key: string,
  rule: LimitRule
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  sweep(now);
  const from = now - rule.windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > from);
  if (hits.length >= rule.limit) {
    buckets.set(key, hits);
    const retryAfterSec = Math.max(1, Math.ceil((hits[0] + rule.windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfterSec };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: rule.limit - hits.length, retryAfterSec: 0 };
}

/** Convenience for route handlers · null when allowed, a 429 when not. */
export function limitOrReject(
  req: Request,
  scope: keyof typeof LIMITS
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const result = rateLimit(`${scope}:${ip}`, LIMITS[scope]);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Too many requests", retryAfter: result.retryAfterSec },
    { status: 429, headers: { "retry-after": String(result.retryAfterSec) } }
  );
}
