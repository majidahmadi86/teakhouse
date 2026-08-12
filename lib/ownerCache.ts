"use client";

/**
 * v14 · Owner section cache · stale-while-revalidate for the panel's own fetches.
 *
 * Every owner section fetched its lists from scratch on mount, so going back to
 * a section you had just left showed a spinner and waited on the network again.
 * The provider already keeps rooms and bookings across route changes; this does
 * the same for the per-section endpoints.
 *
 * Deliberately module-level and tiny: it lives as long as the tab does, is
 * dropped by a full reload, and always revalidates in the background, so the
 * owner sees the last known list instantly and the true one a moment later.
 */

type Entry = { data: unknown; at: number };

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/** How long a cached list is served without a background refresh being useful. */
const FRESH_MS = 15_000;

async function load<T>(url: string): Promise<T> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const p = fetch(url, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`${url} ${res.status}`);
      const data = (await res.json()) as T;
      cache.set(url, { data, at: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, p);
  return p;
}

/**
 * Read a list. `onData` is called at once with the cached value when there is
 * one, and again with fresh data unless the cache was still warm. Returns a
 * promise that settles when the network is done, for callers that want to know.
 */
export function readCached<T>(
  url: string,
  onData: (data: T) => void
): Promise<void> {
  const hit = cache.get(url);
  if (hit) onData(hit.data as T);

  if (hit && Date.now() - hit.at < FRESH_MS) {
    return Promise.resolve();
  }

  return load<T>(url)
    .then((data) => {
      onData(data);
    })
    .catch(() => {
      // A failed refresh must not wipe a list the owner is reading · if there
      // was nothing cached, tell the caller so it can show its empty state.
      if (!hit) onData([] as unknown as T);
    });
}

/** Drop a cached list after a mutation · the next read refetches. */
export function invalidateCached(...urls: string[]) {
  for (const url of urls) cache.delete(url);
}
