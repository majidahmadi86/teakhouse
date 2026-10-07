/**
 * HF-1 · owner API writes need the owner session cookie.
 *
 * Every owner/admin write route answers 401 without it, so a suite that edits
 * through the owner API (hotel settings, dining, events, reservation and
 * request statuses, uploads) asks for a session first, the same way the
 * owner panel does: a same-origin POST /api/owner/session. In demo mode that
 * needs no PIN; otherwise the suite sends the PIN from the environment
 * (.env is loaded by ./qa.js).
 *
 *   const { ownerHeaders } = require("./lib/ownerSession");
 *   fetch(url, { method: "PATCH", headers: { ...(await ownerHeaders(BASE)) } })
 *
 * Guest endpoints ignore the cookie, so sending it everywhere is harmless.
 */

const { loadEnv } = require("./qa");

const cookies = new Map();

async function requestSession(base, body) {
  const res = await fetch(`${base}/api/owner/session`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: new URL(base).origin },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const set = (res.headers.getSetCookie?.() || []).find((c) => c.startsWith("tkh-owner="));
  return set ? set.split(";")[0] : null;
}

/** The `tkh-owner=...` cookie pair for `base`, cached per base. */
async function ownerCookie(base) {
  if (cookies.has(base)) return cookies.get(base);
  loadEnv();
  let cookie = await requestSession(base, {});
  if (!cookie) {
    const pin = process.env.NEXT_PUBLIC_OWNER_PIN || process.env.OWNER_PIN || "1234";
    cookie = await requestSession(base, { pin });
  }
  if (!cookie) throw new Error(`no owner session from ${base}/api/owner/session`);
  cookies.set(base, cookie);
  return cookie;
}

/** Headers that carry the owner session. */
async function ownerHeaders(base) {
  return { cookie: await ownerCookie(base) };
}

module.exports = { ownerCookie, ownerHeaders };
