import { DICT, type DictEntry } from "./i18n-dict";

export type Lang = "en" | "th";

/**
 * Pure dictionary lookup · no next/headers, no hooks. Safe in server AND client
 * components (pass the resolved locale in). Server code reads the locale from
 * the cookie (serverLocale); client code from the i18n context.
 */
export function translate(
  locale: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  const entry = DICT[key];
  let s = entry ? entry[locale] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

export function translateEntry(locale: Lang, entry: DictEntry): string {
  return entry[locale];
}

/** Base-currency (THB) price for zero-JS server rendering. */
export function formatThb(amount: number): string {
  return "฿" + Math.round(amount).toLocaleString("en-US");
}
