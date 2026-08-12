/**
 * Chrome-hydration trigger · deterministic and input-free.
 *
 * Fires the `load` callback 300ms after the window `load` event (or 300ms from
 * now if the document has already finished loading). That is the ONLY trigger:
 *   - NO requestIdleCallback  · idle fires instantly on an idle test machine and
 *     only after ~10s on a busy real device · the exact class of bug this kills.
 *   - NO interaction listeners · a click/scroll/keypress must never be what
 *     mounts a component (that is why the reporter "saw" nav appear on click).
 *   - NO multi-second fallback timeout.
 *
 * Result: hydration timing is identical on every machine · everything is
 * interactive within ~load+300ms, never advanced by input, never delayed to
 * idle. Returns a cleanup function · safe to call once inside a useEffect.
 */
export function mountAfterLoad(load: () => void): () => void {
  let done = false;
  let timeoutId: number | undefined;

  const run = () => {
    if (done) return;
    done = true;
    load();
  };

  const schedule = () => {
    if (timeoutId !== undefined) return;
    timeoutId = window.setTimeout(run, 300);
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    window.removeEventListener("load", schedule);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}
