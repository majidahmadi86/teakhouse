/**
 * v17 · Who may write. The one rule behind read-only mode, shared by
 * next.config.mjs (at build time) and lib/readOnly.ts (at runtime).
 *
 * Fail closed. A process may write only when
 *   1. VERCEL_ENV is exactly "production", or
 *   2. it is not on Vercel at all (none of VERCEL, VERCEL_ENV, VERCEL_URL,
 *      VERCEL_REGION, VERCEL_DEPLOYMENT_ID is set) AND DATABASE_URL names a
 *      database on this machine: a postgres URL whose host is localhost,
 *      127.0.0.1 or ::1, carrying no host, hostaddr or service query
 *      parameter that could send the connection somewhere else.
 * Everything else is read-only: every preview and development deployment, a
 * Vercel build or function without VERCEL_ENV, and any local process (next
 * dev, next start, a tsx script) aimed at a remote, unparseable or missing
 * database URL. DB_READ_ONLY="1" forces read-only on top of all of this.
 *
 * Plain JavaScript with no imports, so next.config.mjs can load it before
 * anything is compiled, and the gate (scripts/preview-safety.js) can test it.
 */

/** System variables Vercel sets in builds and functions. Any one means Vercel. */
const VERCEL_MARKERS = [
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_REGION",
  "VERCEL_DEPLOYMENT_ID",
];

/** Hostnames as WHATWG URL reports them for a postgres URL. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** Query parameters that override where the driver actually connects. */
const REDIRECT_PARAMS = new Set(["host", "hostaddr", "service"]);

/**
 * @param {Record<string, string | undefined>} env
 * @returns {boolean}
 */
export function onVercel(env) {
  return VERCEL_MARKERS.some((k) => Boolean(env[k]));
}

/**
 * True only for a postgres URL that genuinely points at this machine.
 * Parsed, never pattern-matched: "localhost.example.com", a multi-host list,
 * an encoded host or a ?host= override is not local.
 *
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isLocalDatabaseUrl(raw) {
  if (typeof raw !== "string") return false;
  const text = raw.trim();
  if (!text) return false;
  let url;
  try {
    url = new URL(text);
  } catch {
    return false;
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return false;
  }
  if (!LOCAL_HOSTS.has(url.hostname.toLowerCase())) return false;
  for (const key of url.searchParams.keys()) {
    if (REDIRECT_PARAMS.has(key.trim().toLowerCase())) return false;
  }
  return true;
}

/**
 * The decision, with the reason (for logs and the gate; never a secret).
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ writable: boolean, reason: string }}
 */
export function writePolicy(env) {
  if (env.DB_READ_ONLY === "1") {
    return { writable: false, reason: "DB_READ_ONLY=1" };
  }
  if (env.VERCEL_ENV === "production") {
    return { writable: true, reason: "VERCEL_ENV=production" };
  }
  if (onVercel(env)) {
    return {
      writable: false,
      reason: env.VERCEL_ENV
        ? `on Vercel, VERCEL_ENV=${env.VERCEL_ENV}`
        : "on Vercel without VERCEL_ENV",
    };
  }
  if (isLocalDatabaseUrl(env.DATABASE_URL)) {
    return { writable: true, reason: "not on Vercel, database on this machine" };
  }
  return {
    writable: false,
    reason: "not on Vercel, database not on this machine",
  };
}
