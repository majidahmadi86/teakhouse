/**
 * Query strings that change what a guest page renders, as path segments.
 *
 * Guest pages are static (or ISR) per language. A page whose content depends
 * on its query (the contact form's purpose and "sent" note, the reservation
 * confirmations that echo a reference, a validation error) would otherwise
 * have to render on every request. Instead the middleware rewrites
 *
 *   /contact?about=event            -> /<lang>/contact/q/about.event
 *   /dining/reserve?ref=TBL-4K7P... -> /<lang>/dining/reserve/q/ref.TBL-4K7P~date.2026-10-09~...
 *
 * and that internal route renders once per distinct query and is cached (ISR).
 * The visible URL never changes, so the server actions keep redirecting to the
 * plain public URLs.
 *
 * Only the keys listed here pass, each value must match its pattern, keys are
 * written in a fixed order, and nothing else of the query is kept: a crawler
 * cannot mint cache entries with arbitrary strings, and two spellings of the
 * same query share one entry. Values never contain "." or "~", which are the
 * separators. Client- and edge-safe.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ERR = /^[a-z]{2,12}$/;

export const QUERY_ROUTES = {
  "/contact": {
    about: /^(stay|dining|event|other)$/,
    sent: /^1$/,
    error: ERR,
  },
  "/dining/reserve": {
    ref: /^TBL-[A-Z0-9]{3,8}$/,
    date: ISO,
    time: /^\d{2}:\d{2}$/,
    party: /^\d{1,2}$/,
    error: ERR,
  },
  "/events/reserve": {
    event: /^[A-Za-z0-9_-]{1,64}$/,
    ref: /^EVT-[A-Z0-9]{3,8}$/,
    guests: /^\d{1,2}$/,
    date: ISO,
    error: ERR,
  },
} as const satisfies Record<string, Record<string, RegExp>>;

export type QueryRoute = keyof typeof QUERY_ROUTES;

export function isQueryRoute(path: string): path is QueryRoute {
  return Object.prototype.hasOwnProperty.call(QUERY_ROUTES, path);
}

/** The route's allowed query as one path segment, or null when there is none. */
export function encodeRouteQuery(route: QueryRoute, params: URLSearchParams): string | null {
  const spec = QUERY_ROUTES[route] as Record<string, RegExp>;
  const parts: string[] = [];
  for (const key of Object.keys(spec)) {
    const v = params.get(key);
    if (v && spec[key].test(v)) parts.push(`${key}.${v}`);
  }
  return parts.length ? parts.join("~") : null;
}

/** The segment back into a query object, every value re-validated. */
export function decodeRouteQuery(route: QueryRoute, segment: string | undefined): Record<string, string> {
  const spec = QUERY_ROUTES[route] as Record<string, RegExp>;
  const out: Record<string, string> = {};
  if (!segment) return out;
  let raw = segment;
  try {
    raw = decodeURIComponent(segment);
  } catch {
    /* already decoded */
  }
  for (const pair of raw.split("~")) {
    const dot = pair.indexOf(".");
    if (dot < 1) continue;
    const key = pair.slice(0, dot);
    const value = pair.slice(dot + 1);
    if (spec[key] && spec[key].test(value)) out[key] = value;
  }
  return out;
}
