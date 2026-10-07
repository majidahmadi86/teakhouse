/**
 * Locale metadata · client-safe, edge-safe, dictionary-free (ported from the
 * v16 engine, teakhouse branch `sovra` 40d940d).
 *
 * Everything that needs to know WHICH languages exist (the language menu, the
 * middleware, the root layout, the client i18n provider) imports this file.
 * The dictionaries themselves live in lib/locales/index.ts, which only server
 * modules may import · that is what keeps sixteen languages out of the
 * browser bundle.
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

export type Script = "latin" | "thai" | "cjk-sc" | "cjk-jp" | "cjk-kr" | "cyrillic" | "arabic" | "devanagari";

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
  /** Which font pair the page needs · drives locale-conditional font loading */
  script: Script;
  /** One-line welcome in that language · the language sheet */
  welcome: string;
};

export const LANGS: LangMeta[] = [
  { code: "en", native: "English", english: "English", dir: "ltr", tag: "en", og: "en_TH", script: "latin", welcome: "Welcome to the house by the river." },
  { code: "th", native: "ไทย", english: "Thai", dir: "ltr", tag: "th", og: "th_TH", script: "thai", welcome: "ยินดีต้อนรับสู่บ้านริมแม่น้ำ" },
  { code: "zh", native: "中文", english: "Simplified Chinese", dir: "ltr", tag: "zh-Hans", og: "zh_CN", script: "cjk-sc", welcome: "欢迎来到河畔之家。" },
  { code: "ja", native: "日本語", english: "Japanese", dir: "ltr", tag: "ja", og: "ja_JP", script: "cjk-jp", welcome: "川辺の家へようこそ。" },
  { code: "ko", native: "한국어", english: "Korean", dir: "ltr", tag: "ko", og: "ko_KR", script: "cjk-kr", welcome: "강가의 집에 오신 것을 환영합니다." },
  { code: "ru", native: "Русский", english: "Russian", dir: "ltr", tag: "ru", og: "ru_RU", script: "cyrillic", welcome: "Добро пожаловать в дом у реки." },
  { code: "de", native: "Deutsch", english: "German", dir: "ltr", tag: "de", og: "de_DE", script: "latin", welcome: "Willkommen im Haus am Fluss." },
  { code: "fr", native: "Français", english: "French", dir: "ltr", tag: "fr", og: "fr_FR", script: "latin", welcome: "Bienvenue dans la maison au bord du fleuve." },
  { code: "es", native: "Español", english: "Spanish", dir: "ltr", tag: "es", og: "es_ES", script: "latin", welcome: "Bienvenido a la casa junto al río." },
  { code: "it", native: "Italiano", english: "Italian", dir: "ltr", tag: "it", og: "it_IT", script: "latin", welcome: "Benvenuti nella casa sul fiume." },
  { code: "pt", native: "Português", english: "Portuguese", dir: "ltr", tag: "pt", og: "pt_BR", script: "latin", welcome: "Bem-vindo à casa à beira do rio." },
  { code: "ar", native: "العربية", english: "Arabic", dir: "rtl", tag: "ar", og: "ar_AE", script: "arabic", welcome: "أهلاً بكم في البيت على ضفة النهر." },
  { code: "hi", native: "हिन्दी", english: "Hindi", dir: "ltr", tag: "hi", og: "hi_IN", script: "devanagari", welcome: "नदी किनारे के घर में आपका स्वागत है।" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", dir: "ltr", tag: "id", og: "id_ID", script: "latin", welcome: "Selamat datang di rumah tepi sungai." },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese", dir: "ltr", tag: "vi", og: "vi_VN", script: "latin", welcome: "Chào mừng đến với ngôi nhà bên sông." },
  { code: "ms", native: "Bahasa Melayu", english: "Malay", dir: "ltr", tag: "ms", og: "ms_MY", script: "latin", welcome: "Selamat datang ke rumah di tepi sungai." },
];

export const LANG_CODES = LANGS.map((l) => l.code);

/** The language a request falls back to when nothing else decides. */
export const DEFAULT_LANG: Lang = "en";

/** The locale cookie · ?lang= promotes into it, the language menu writes it. */
export const LOCALE_COOKIE = "tkh-lang";

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANG_CODES as string[]).includes(v);
}

export function langMeta(code: Lang): LangMeta {
  return LANGS.find((l) => l.code === code) ?? LANGS[0];
}

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
