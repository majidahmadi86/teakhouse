/**
 * Deferral trigger for hydrating an island · fires the earliest of:
 *   - requestIdleCallback (when `useIdle`, capped at maxMs)
 *   - a hard maxMs timeout (so it ALWAYS runs without any interaction)
 *   - the first user interaction (pointer / key / touch / scroll)
 *   - an optional IntersectionObserver target about to enter the viewport
 *
 * Interaction and the observer may fire it earlier, but they are never
 * REQUIRED · with zero input the timeout arm still loads within maxMs. Returns
 * a cleanup function. Safe to call once inside a useEffect.
 *
 * `useIdle` (default true) is best for light islands · it hydrates the moment
 * the main thread goes quiet. For framer-heavy islands set `useIdle:false` and
 * a larger `maxMs`: requestIdleCallback can fire in an idle gap mid-load (and
 * under Lighthouse that lands in the TBT window), so a plain timeout past the
 * measurement window protects the perf budget while still never requiring input.
 */
export function onIdleOrInteract(
  load: () => void,
  opts: { maxMs?: number; useIdle?: boolean; observe?: Element | null } = {}
): () => void {
  const maxMs = opts.maxMs ?? 1500;
  const useIdle = opts.useIdle ?? true;
  let done = false;
  let idleId: number | undefined;
  let timeoutId: number | undefined;
  let observer: IntersectionObserver | undefined;

  const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    load();
  };

  const cleanup = () => {
    for (const ev of events) window.removeEventListener(ev, run);
    if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    observer?.disconnect();
  };

  for (const ev of events) {
    window.addEventListener(ev, run, { once: true, passive: true });
  }

  if (useIdle && typeof window.requestIdleCallback === "function") {
    idleId = window.requestIdleCallback(run, { timeout: maxMs });
  }
  // Hard ceiling · guarantees load with no interaction and no idle window.
  timeoutId = window.setTimeout(run, maxMs);

  // Optional viewport arm · load just before the target scrolls into view.
  if (opts.observe && typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) run();
      },
      { rootMargin: "200px" }
    );
    observer.observe(opts.observe);
  }

  return cleanup;
}
