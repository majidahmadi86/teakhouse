import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Lang } from "./locales/meta";
import { translate, translateEntry } from "./translate";
import type { DictEntry } from "./i18n-dict";

export type { Lang };
export { LOCALE_COOKIE };

/**
 * The owner panel's language · EN or TH (its two languages), from the cookie.
 * The panel renders per request, so it may read the cookie; guest pages may
 * not (they take their language from the route, lib/pageLocale.ts).
 */
export function getOwnerLocale(): Lang {
  return cookies().get(LOCALE_COOKIE)?.value === "th" ? "th" : "en";
}

/** Server-side translate · mirrors the client t(). */
export function t(
  locale: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  return translate(locale, key, vars);
}

/** Server-side variant of tr() for pre-built DictEntry values. */
export function tr(locale: Lang, entry: DictEntry): string {
  return translateEntry(locale, entry);
}
