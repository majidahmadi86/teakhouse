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
import { LOCALE_EXTRA } from "./extra";

/**
 * v15 · Sixteen guest languages.
 *
 * English and Thai are authored in lib/i18n-dict*.ts as {en, th} pairs and
 * cover the whole product, staff panel included. The fourteen others cover
 * every guest-facing key (lib/locales/<code>.ts) and fall back to English for
 * anything else, so a missing string can never blank a screen. Database
 * content (room copy, menu, packages) is bilingual EN/TH; other locales read
 * the English column. The concierge answers in the guest's language whatever
 * it is.
 */

export type Lang =
  | "en"
  | "th"
  | "zh"
  | "ja"
  | "ko"
  | "ru"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "ar"
  | "hi"
  | "id"
  | "vi"
  | "ms";

export type LangMeta = {
  code: Lang;
  /** The language's own name · what the menu shows */
  native: string;
  /** English name · what the concierge is told to reply in */
  english: string;
  dir: "ltr" | "rtl";
  /** BCP-47 tag for <html lang> and Intl */
  tag: string;
  /** Open Graph locale */
  og: string;
};

export const LANGS: LangMeta[] = [
  { code: "en", native: "English", english: "English", dir: "ltr", tag: "en", og: "en_TH" },
  { code: "th", native: "ไทย", english: "Thai", dir: "ltr", tag: "th", og: "th_TH" },
  { code: "zh", native: "中文", english: "Simplified Chinese", dir: "ltr", tag: "zh-Hans", og: "zh_CN" },
  { code: "ja", native: "日本語", english: "Japanese", dir: "ltr", tag: "ja", og: "ja_JP" },
  { code: "ko", native: "한국어", english: "Korean", dir: "ltr", tag: "ko", og: "ko_KR" },
  { code: "ru", native: "Русский", english: "Russian", dir: "ltr", tag: "ru", og: "ru_RU" },
  { code: "de", native: "Deutsch", english: "German", dir: "ltr", tag: "de", og: "de_DE" },
  { code: "fr", native: "Français", english: "French", dir: "ltr", tag: "fr", og: "fr_FR" },
  { code: "es", native: "Español", english: "Spanish", dir: "ltr", tag: "es", og: "es_ES" },
  { code: "it", native: "Italiano", english: "Italian", dir: "ltr", tag: "it", og: "it_IT" },
  { code: "pt", native: "Português", english: "Portuguese", dir: "ltr", tag: "pt", og: "pt_BR" },
  { code: "ar", native: "العربية", english: "Arabic", dir: "rtl", tag: "ar", og: "ar_AE" },
  { code: "hi", native: "हिन्दी", english: "Hindi", dir: "ltr", tag: "hi", og: "hi_IN" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", dir: "ltr", tag: "id", og: "id_ID" },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese", dir: "ltr", tag: "vi", og: "vi_VN" },
  { code: "ms", native: "Bahasa Melayu", english: "Malay", dir: "ltr", tag: "ms", og: "ms_MY" },
];

export const LANG_CODES = LANGS.map((l) => l.code);

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANG_CODES as string[]).includes(v);
}

export function langMeta(code: Lang): LangMeta {
  return LANGS.find((l) => l.code === code) ?? LANGS[0];
}

/** Translated guest strings for the fourteen non-authored languages. */
const merge = (code: Lang, base: Record<string, string>): Record<string, string> => ({ ...base, ...(LOCALE_EXTRA[code] ?? {}) });

export const LOCALES: Partial<Record<Lang, Record<string, string>>> = {
  zh: merge("zh", LOCALE_ZH),
  ja: merge("ja", LOCALE_JA),
  ko: merge("ko", LOCALE_KO),
  ru: merge("ru", LOCALE_RU),
  de: merge("de", LOCALE_DE),
  fr: merge("fr", LOCALE_FR),
  es: merge("es", LOCALE_ES),
  it: merge("it", LOCALE_IT),
  pt: merge("pt", LOCALE_PT),
  ar: merge("ar", LOCALE_AR),
  hi: merge("hi", LOCALE_HI),
  id: merge("id", LOCALE_ID),
  vi: merge("vi", LOCALE_VI),
  ms: merge("ms", LOCALE_MS),
};

/** Best language from an Accept-Language header · the first-visit default. */
export function negotiateLang(header: string | null | undefined): Lang {
  if (!header) return "en";
  const wanted = header
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase())
    .filter(Boolean);
  for (const tag of wanted) {
    const base = tag.split("-")[0];
    if (isLang(tag)) return tag;
    if (isLang(base)) return base;
  }
  return "en";
}
