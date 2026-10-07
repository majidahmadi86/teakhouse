"use client";

/**
 * HF-1 · The owner panel's side of the server-side owner session.
 *
 * The session is an httpOnly cookie (lib/ownerSession.ts), so the browser
 * cannot read it; this module only asks the server for one and remembers the
 * answer for the tab. Owner writes go through ownerFetch, which makes sure a
 * session exists first and retries once after a 401 (an expired cookie).
 *
 * Guest pages never call any of this: /book and /account share the owner
 * store for its data, but their writes are guest writes and stay plain fetch.
 */

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const ENDPOINT = "/api/owner/session";

/** Fired on window when the server no longer accepts this tab's session. */
export const OWNER_SESSION_LOST = "tkh-owner-session-lost";

let ready: Promise<boolean> | null = null;

async function requestSession(pin?: string): Promise<boolean> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pin === undefined ? {} : { pin }),
    cache: "no-store",
  });
  return res.ok;
}

async function hasSession(): Promise<boolean> {
  const res = await fetch(ENDPOINT, { cache: "no-store" });
  if (!res.ok) return false;
  const body = (await res.json()) as { active?: boolean };
  return body.active === true;
}

/**
 * Resolve true once this tab holds a valid owner session. Demo mode asks for
 * a demo session (no PIN); otherwise it only checks for the session the PIN
 * login created. A false answer is not cached, so the next call asks again.
 */
export function ensureOwnerSession(): Promise<boolean> {
  if (!ready) {
    const attempt = (DEMO ? requestSession() : hasSession()).catch(() => false);
    ready = attempt;
    void attempt.then((ok) => {
      if (!ok && ready === attempt) ready = null;
    });
  }
  return ready;
}

/** PIN login · the server verifies the PIN and sets the cookie. */
export async function startOwnerSession(pin: string): Promise<boolean> {
  const ok = await requestSession(pin).catch(() => false);
  ready = ok ? Promise.resolve(true) : null;
  return ok;
}

/** Sign out · drops the cookie on the server too. */
export function endOwnerSession() {
  ready = null;
  void fetch(ENDPOINT, { method: "DELETE" }).catch(() => {});
}

/** fetch for owner writes · session first, one retry after a 401. */
export async function ownerFetch(
  input: string,
  init?: RequestInit
): Promise<Response> {
  await ensureOwnerSession();
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  ready = null;
  if (await ensureOwnerSession()) return fetch(input, init);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OWNER_SESSION_LOST));
  }
  return res;
}
