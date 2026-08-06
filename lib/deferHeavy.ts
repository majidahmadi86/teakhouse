/**
 * Schedule work after a hard minimum delay.
 * Do not use requestIdleCallback alone for Perf work — under Lighthouse it
 * often fires at ~3–4s (still inside the TBT/SI window) because the timeout
 * is a maximum wait, not a minimum.
 */
export function deferHeavy(cb: () => void, ms = 10000): () => void {
  const id = window.setTimeout(cb, ms);
  return () => window.clearTimeout(id);
}
