import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { isDemoModeServer } from "@/lib/demoReset";
import { isCrossOrigin } from "@/lib/sameOrigin";

/**
 * HF-1 · Server-side owner session.
 *
 * Before HF-1 the owner panel's only gate was a PIN compared in the browser
 * and a localStorage flag, so every owner API route was open to anyone. Now
 * POST /api/owner/session issues an httpOnly cookie that carries an expiry
 * and an HMAC, and every owner write checks it on the server.
 *
 * Cookie value: v1.<kind>.<expiresAtMs>.<base64url HMAC-SHA256>
 *   kind "owner"  issued for the right PIN
 *   kind "demo"   issued without a PIN while the server is in demo mode (the
 *                 demo panel opens without a PIN); stops being valid the
 *                 moment demo mode is switched off
 *
 * The signing key is HMAC-SHA256(CRON_SECRET, a fixed label), so rotating
 * CRON_SECRET signs every owner out. Without CRON_SECRET, a Vercel deployment
 * (or any production server not answering on localhost) can neither issue
 * nor accept a session: it fails closed. Only a local server reached on
 * localhost falls back to a fixed local-only key.
 */

export const OWNER_COOKIE = "tkh-owner";
const VERSION = "v1";
const KEY_LABEL = "tkh-owner-session-v1";
/** Local development only · never used on Vercel or off localhost. */
const LOCAL_ONLY_FALLBACK_SECRET = "teakhouse-LOCAL-DEV-ONLY-not-a-secret";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type OwnerSessionKind = "owner" | "demo";
export type OwnerSession = { kind: OwnerSessionKind; expiresAt: number };

function onVercel(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function isLocalRequest(req: Request): boolean {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

/** The HMAC key, or null when sessions must fail closed. */
function sessionKey(req: Request): Buffer | null {
  const secret = process.env.CRON_SECRET ?? "";
  if (secret) return createHmac("sha256", secret).update(KEY_LABEL).digest();
  if (onVercel()) return null;
  if (process.env.NODE_ENV === "production" && !isLocalRequest(req)) {
    return null;
  }
  return createHmac("sha256", LOCAL_ONLY_FALLBACK_SECRET)
    .update(KEY_LABEL)
    .digest();
}

/** Whether this server can issue owner sessions at all. */
export function ownerSessionsAvailable(req: Request): boolean {
  return sessionKey(req) !== null;
}

function sign(key: Buffer, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function sameBytes(a: string, b: string): boolean {
  // Hash first so the compare is constant-time whatever the lengths.
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

/**
 * The owner PIN, from the same source the browser checked before HF-1
 * (NEXT_PUBLIC_OWNER_PIN, else the documented demo PIN), now verified here.
 */
export function ownerPinMatches(pin: string): boolean {
  const expected = process.env.NEXT_PUBLIC_OWNER_PIN ?? "1234";
  return sameBytes(pin, expected);
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    // The value is [A-Za-z0-9._-] only, so it is compared as sent.
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/** The verified session on this request, or null. Never touches the DB. */
export function readOwnerSession(req: Request): OwnerSession | null {
  const key = sessionKey(req);
  if (!key) return null;
  const raw = readCookie(req, OWNER_COOKIE);
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  const [, kind, exp, sig] = parts;
  if (kind !== "owner" && kind !== "demo") return null;
  if (!/^\d{1,15}$/.test(exp)) return null;
  if (!sameBytes(sig, sign(key, `${VERSION}.${kind}.${exp}`))) return null;
  const expiresAt = Number(exp);
  if (expiresAt <= Date.now()) return null;
  if (kind === "demo" && !isDemoModeServer()) return null;
  return { kind, expiresAt };
}

function cookieSecure(req: Request): boolean {
  // Secure in production. A local `next start` is NODE_ENV=production but
  // served over plain http on localhost, where a Secure cookie would not
  // reach every client the gates use.
  return process.env.NODE_ENV === "production" && !isLocalRequest(req);
}

/** Set a fresh session cookie on `res`. Returns false when sessions are off. */
export function issueOwnerSession(
  req: Request,
  res: NextResponse,
  kind: OwnerSessionKind
): boolean {
  const key = sessionKey(req);
  if (!key) return false;
  const exp = String(Date.now() + SESSION_TTL_MS);
  const payload = `${VERSION}.${kind}.${exp}`;
  res.cookies.set(OWNER_COOKIE, `${payload}.${sign(key, payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(req),
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return true;
}

export function clearOwnerSession(req: Request, res: NextResponse) {
  res.cookies.set(OWNER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(req),
    path: "/",
    maxAge: 0,
  });
}

/**
 * Gate for every owner write. Returns the response to send when the request
 * is refused, or null to go ahead:
 *   401  no valid owner session (always, whatever else is wrong)
 *   403  a valid session, but the browser says the request is cross-origin
 */
export function requireOwner(req: Request): NextResponse | null {
  if (!readOwnerSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isCrossOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin" }, { status: 403 });
  }
  return null;
}
