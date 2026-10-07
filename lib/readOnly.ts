/**
 * v17 · Read-only deployments (preview safety).
 *
 * A Vercel preview cannot be told apart from production by its database: the
 * Preview DATABASE_URL is a sensitive value nobody can read, and SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY are one entry shared by Production and
 * Preview. So a preview is treated as if it reaches the production database,
 * and in a preview NOTHING writes:
 *
 *  - lib/db.ts wraps Prisma so everything but a model read (model writes and
 *    all raw SQL, reads included) throws ReadOnlyDeploymentError before a
 *    statement is sent;
 *  - every write route answers 403 through readOnlyResponse();
 *  - the reseed paths (the cron, POST /api/data/reset, seedDatabase) return
 *    before any work; HF-1 already took the reseed off every request path;
 *  - the guest forms show their existing "something went wrong" message.
 *
 * The rule fails closed (lib/writePolicy.mjs): writable only when VERCEL_ENV
 * is exactly "production", or when the process is not on Vercel at all and
 * DATABASE_URL genuinely points at this machine. Every other case, a local
 * script aimed at a remote database included, is read-only.
 *
 * It is applied twice, and either half is enough to make a process read-only:
 *  - build half: next.config.mjs runs the rule on the build's own env and
 *    bakes the answer into the bundle as DB_READ_ONLY, "1" (read-only) or "0"
 *    (writable). The value is never empty because Next only inlines truthy
 *    `env` values: an empty string would not be baked at all, and this line
 *    would quietly read the live variable instead. Inside a Next bundle the
 *    dot-access form below is replaced by the literal, so the runtime env
 *    cannot undo a read-only build. Outside Next (tsx scripts) it is the live
 *    variable, and DB_READ_ONLY=1 opts a process in.
 *  - runtime half: the same rule on the live process.env, in every process.
 *    A "0" build is therefore still read-only when it is served as a preview,
 *    on Vercel without VERCEL_ENV, or against a database not on this machine.
 *
 * Writable in practice: the production deployment (VERCEL_ENV=production)
 * and local dev, the gates and the seed against the dev DB on localhost.
 *
 * This module is server code whose only import is the plain-JS rule, so
 * lib/db.ts and the gate script (through tsx) can load it directly.
 */
import { writePolicy } from "./writePolicy.mjs";

export const READ_ONLY_CODE = "READ_ONLY_DEPLOYMENT";

/** True when this process must not write anywhere. */
export function isReadOnlyDeployment(): boolean {
  // Build half. Dot access on purpose: next.config.mjs `env` inlines exactly
  // this form ("1" or "0").
  if (process.env.DB_READ_ONLY === "1") return true;
  // Runtime half, never skipped.
  return !writePolicy(process.env).writable;
}

/** Thrown by the Prisma guard and the other write paths in read-only mode. */
export class ReadOnlyDeploymentError extends Error {
  readonly code = READ_ONLY_CODE;

  constructor(what: string) {
    super(`Read-only deployment: ${what} refused`);
    this.name = "ReadOnlyDeploymentError";
  }
}

export function isReadOnlyError(e: unknown): e is ReadOnlyDeploymentError {
  return (
    e instanceof ReadOnlyDeploymentError ||
    (typeof e === "object" &&
      e !== null &&
      (e as { code?: unknown }).code === READ_ONLY_CODE)
  );
}

/** Throws when read-only. For code paths that have no response to shape. */
export function assertWritable(what: string): void {
  if (isReadOnlyDeployment()) throw new ReadOnlyDeploymentError(what);
}

/** The JSON body every refused route returns, so callers can recognise it. */
export const READ_ONLY_BODY = {
  error: "read-only-deployment",
  code: READ_ONLY_CODE,
  message: "This preview is read-only. Changes are disabled here.",
} as const;

/**
 * For route handlers: a 403 JSON response when read-only, else null.
 *
 *   const ro = readOnlyResponse();
 *   if (ro) return ro;
 *
 * A plain Response (not NextResponse) keeps this module import-free.
 */
export function readOnlyResponse(): Response | null {
  if (!isReadOnlyDeployment()) return null;
  return new Response(JSON.stringify(READ_ONLY_BODY), {
    status: 403,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
