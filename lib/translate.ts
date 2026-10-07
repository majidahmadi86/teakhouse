import { interpolate, translateEntry } from "./i18n-core";
import { lookup } from "./locales";
import type { Lang } from "./locales/meta";
import type { DictEntry } from "./i18n-dict";

export type { Lang, DictEntry };
export { translateEntry };

/**
 * Server-side dictionary lookup · sixteen languages. EN and TH are authored
 * pairs; the other fourteen come from lib/locales and fall back to English per
 * key. Client components never import this module (it pulls every dictionary):
 * they read the one language they were handed through useI18n(), or take
 * already-translated strings as props.
 */
export function translate(
  locale: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  return interpolate(lookup(locale, key) ?? key, vars);
}

/** Base-currency (THB) price for zero-JS server rendering. */
export function formatThb(amount: number): string {
  return "฿" + Math.round(amount).toLocaleString("en-US");
}
