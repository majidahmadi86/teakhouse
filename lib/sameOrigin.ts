/**
 * HF-1 · Same-origin checks for state-changing API calls.
 *
 * Browsers send Origin on every POST, PATCH and DELETE, same-origin requests
 * included, and Sec-Fetch-Site on every request. These checks stop a page on
 * another site from driving the owner API with the owner's cookie (the cookie
 * is SameSite=Lax as well, so this is the second of two locks). They are not
 * authentication: a non-browser client can send any header it likes, which is
 * why every owner write also needs a valid owner session.
 */

/** The host this request was addressed to, as the browser saw it. */
function requestHosts(req: Request): string[] {
  const hosts: string[] = [];
  const host = req.headers.get("host");
  if (host) hosts.push(host.toLowerCase());
  // Behind Vercel's proxy the original host is also in x-forwarded-host.
  const fwd = req.headers.get("x-forwarded-host");
  if (fwd) hosts.push(fwd.split(",")[0].trim().toLowerCase());
  return hosts;
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null; // "null" and anything unparseable
  }
}

/**
 * Strict: the Origin header names this host, or, when a browser sent no
 * Origin, Sec-Fetch-Site says same-origin. A request with neither is refused.
 * Used where a request must come from the site's own pages: issuing an owner
 * session and resetting the demo.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin !== null) {
    const host = originHost(origin);
    return host !== null && requestHosts(req).includes(host);
  }
  return req.headers.get("sec-fetch-site") === "same-origin";
}

/**
 * Lenient: true only when the browser says the request came from another
 * origin. A request with no Origin and no Sec-Fetch-Site (a server-side
 * script holding a session cookie) is not cross-origin.
 */
export function isCrossOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin !== null) {
    const host = originHost(origin);
    return host === null || !requestHosts(req).includes(host);
  }
  const site = req.headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "none";
}
