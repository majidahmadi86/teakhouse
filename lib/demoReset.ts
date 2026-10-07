import { prisma } from "@/lib/db";

export function isDemoModeServer(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

/** HF-1 · at most one owner-triggered reset per window, site-wide. */
export const RESET_WINDOW_MS = 10 * 60 * 1000;

export type ResetClaim = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Claim the global reset slot through the DemoMeta marker.
 *
 * The claim is one conditional UPDATE, atomic in Postgres: it succeeds only
 * when the last reset (a reset, or the cron's reseed) is older than the
 * window, so two concurrent callers can never both win. The reseed that
 * follows rewrites the marker inside its own transaction; if it fails and
 * rolls back, the claim stands and the next attempt waits out the window.
 */
export async function claimDemoReset(now = new Date()): Promise<ResetClaim> {
  const cutoff = new Date(now.getTime() - RESET_WINDOW_MS);
  const claimed = await prisma.demoMeta.updateMany({
    where: { id: "demo", lastReset: { lt: cutoff } },
    data: { lastReset: now },
  });
  if (claimed.count === 1) return { ok: true };

  const meta = await prisma.demoMeta.findUnique({ where: { id: "demo" } });
  if (meta) {
    const waitMs = meta.lastReset.getTime() + RESET_WINDOW_MS - now.getTime();
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
  }
  try {
    // No marker at all (an empty database) · creating it is the claim.
    await prisma.demoMeta.create({ data: { id: "demo", lastReset: now } });
    return { ok: true };
  } catch {
    return { ok: false, retryAfterSec: Math.ceil(RESET_WINDOW_MS / 1000) };
  }
}
