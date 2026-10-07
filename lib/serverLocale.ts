import { cookies, headers } from "next/headers";
import { isLang, LOCALE_COOKIE, negotiateLang, type Lang } from "./locales/meta";
import { translate, translateEntry } from "./translate";
import type { DictEntry } from "./i18n-dict";

export type { Lang };
export { LOCALE_COOKIE };

/**
 * Request-resolved locale · the cookie when set, otherwise the browser's
 * Accept-Language (the middleware pins that first choice as the cookie, so
 * the next request is deterministic).
 */
export function getServerLocale(): Lang {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  if (isLang(value)) return value;
  return negotiateLang(headers().get("accept-language"));
}

/**
 * Server-resolved request pathname (set by middleware as `x-pathname`).
 * Lets server components (e.g. HeaderShell) know the active route so the
 * zero-JS shell can highlight the active nav item like the hydrated Header.
 */
export function getServerPathname(): string {
  return headers().get("x-pathname") ?? "/";
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
