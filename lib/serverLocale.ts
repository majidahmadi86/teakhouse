import { cookies } from "next/headers";
import { translate, translateEntry, type Lang } from "./translate";
import type { DictEntry } from "./i18n-dict";

export type { Lang };

/** Single source of truth for the guest/owner UI language. */
export const LOCALE_COOKIE = "tkh-lang";

/** Server-resolved locale · read once per render from the request cookie. */
export function getServerLocale(): Lang {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "th" ? "th" : "en";
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
