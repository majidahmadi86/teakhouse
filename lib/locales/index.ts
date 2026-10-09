import "server-only";
import { LOCALE_AR } from "./ar";
import { LOCALE_DE } from "./de";
import { LOCALE_ES } from "./es";
import { LOCALE_FR } from "./fr";
import { LOCALE_HI } from "./hi";
import { LOCALE_ID } from "./id";
import { LOCALE_IT } from "./it";
import { LOCALE_JA } from "./ja";
import { LOCALE_KO } from "./ko";
import { LOCALE_MS } from "./ms";
import { LOCALE_PT } from "./pt";
import { LOCALE_RU } from "./ru";
import { LOCALE_VI } from "./vi";
import { LOCALE_ZH } from "./zh";
import { DICT } from "../i18n-dict";
import type { Lang } from "./meta";

export * from "./meta";

/**
 * The dictionaries · SERVER ONLY (the v16 engine, ported).
 *
 * English and Thai are authored in lib/i18n-dict.ts as {en, th} pairs and
 * cover the whole product, owner panel included. The fourteen others live in
 * lib/locales/<code>.ts and fall back to English per key. The browser never
 * receives this module: server components translate directly, and a client
 * island gets exactly one language's strings, and only the keys it needs,
 * through messagesFor() → <I18nProvider messages>.
 */
export const LOCALES: Partial<Record<Lang, Record<string, string>>> = {
  zh: LOCALE_ZH,
  ja: LOCALE_JA,
  ko: LOCALE_KO,
  ru: LOCALE_RU,
  de: LOCALE_DE,
  fr: LOCALE_FR,
  es: LOCALE_ES,
  it: LOCALE_IT,
  pt: LOCALE_PT,
  ar: LOCALE_AR,
  hi: LOCALE_HI,
  id: LOCALE_ID,
  vi: LOCALE_VI,
  ms: LOCALE_MS,
};

/** One key in one language · English when the language has no entry yet. */
export function lookup(locale: Lang, key: string): string | undefined {
  const entry = DICT[key];
  if (locale === "en" || locale === "th") return entry?.[locale];
  return LOCALES[locale]?.[key] ?? entry?.en;
}

const cache = new Map<string, Record<string, string>>();

/**
 * One language's strings as a flat object · what a client island receives.
 * `prefixes` narrows it (the concierge needs only cg.*), which keeps the RSC
 * payload small on the pages that matter most.
 */
export function messagesFor(lang: Lang, prefixes?: readonly string[]): Record<string, string> {
  const key = `${lang}|${prefixes?.join(",") ?? "*"}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const k of Object.keys(DICT)) {
    if (prefixes && !prefixes.some((p) => k.startsWith(p))) continue;
    out[k] = lookup(lang, k) ?? k;
  }
  cache.set(key, out);
  return out;
}

/** The strings the concierge chat needs (it loads on click with these). */
export const CONCIERGE_KEYS = ["cg.", "a11y.conciergeChat", "a11y.send", "mobile.close"] as const;

/** The strings the /book flow needs (BookPageClient and components/booking). */
export const BOOK_KEYS = [
  "a11y.", "acc.", "avail.", "bk.", "cal.", "chip.", "col.", "cur.", "drp.", "mobile.",
  "nav.", "room.", "rooms.", "sec.", "trust.", "urg.", "g1", "g2", "g3", "g4", "g5", "g6",
] as const;

/** The strings /account, sign-in and sign-up need. */
export const ACCOUNT_KEYS = ["a11y.", "acc.", "bk.", "hero.", "mobile.", "nav."] as const;
