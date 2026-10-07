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
 * Two signals, either one is enough:
 *  - VERCEL_ENV is "preview" at runtime;
 *  - DB_READ_ONLY is "1". next.config.mjs bakes this at build time from the
 *    build's own VERCEL_ENV, so a preview build stays read-only even if the
 *    system env vars are not exposed to the function at runtime. In a Next
 *    build `process.env.DB_READ_ONLY` is replaced by that literal, so a
 *    runtime value cannot switch a production build to read-only or back.
 *
 * Production (VERCEL_ENV=production) and local dev (unset) stay writable.
 *
 * This module is server code with no imports, so lib/db.ts and the gate
 * script (scripts/preview-safety.js, through tsx) can load it directly.
 */

export const READ_ONLY_CODE = "READ_ONLY_DEPLOYMENT";

/** True when this deployment must not write anywhere. */
export function isReadOnlyDeployment(): boolean {
  // Dot access on purpose: next.config.mjs `env` inlines exactly this form.
  return (
    process.env.VERCEL_ENV === "preview" || process.env.DB_READ_ONLY === "1"
  );
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
