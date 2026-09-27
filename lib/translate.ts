import { DICT, type DictEntry } from "./i18n-dict";
import { LOCALES, type Lang } from "./locales";

export type { Lang };

/**
 * Pure dictionary lookup · no next/headers, no hooks. Safe in server AND client
 * components (pass the resolved locale in). Server code reads the locale from
 * the cookie (serverLocale); client code from the i18n context.
 *
 * v15 · sixteen languages. EN and TH are authored pairs; the other fourteen
 * come from lib/locales and fall back to English per key.
 */
export function lookup(locale: Lang, key: string): string | undefined {
  if (locale === "en" || locale === "th") return DICT[key]?.[locale];
  return LOCALES[locale]?.[key] ?? DICT[key]?.en;
}

export function translate(
  locale: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  let s = lookup(locale, key) ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

/** A bilingual value (room copy, menu, packages) in the guest's language · English outside TH. */
export function translateEntry(locale: Lang, entry: DictEntry): string {
  if (locale === "th") return entry.th || entry.en;
  const wide = entry as DictEntry & Partial<Record<Lang, string>>;
  return wide[locale] ?? entry.en;
}

/** Base-currency (THB) price for zero-JS server rendering. */
export function formatThb(amount: number): string {
  return "฿" + Math.round(amount).toLocaleString("en-US");
}
