import { langMeta, type Lang } from "@/lib/locales/meta";

/**
 * Pure i18n primitives · client-safe, edge-safe, dictionary-free.
 *
 * Ported from the v16 engine (teakhouse branch `sovra`, 40d940d) without any
 * brand tokens. Interpolation, bilingual database entries, and every plural,
 * date and number the guest UI shows go through Intl, so all sixteen languages
 * behave like themselves ("1 night", "2 ночи", "5 ночей", "Wed 8 Oct").
 *
 * ONE date format, everywhere a stay date is shown (the booking bar on every
 * page, the /book date box and its no-JS shell, the summary, the receipt):
 * formatDay() · weekday, day, short month in the page language, the year only
 * where a document needs it. formatStayRange() joins two of them with an
 * arrow. No surface words a date its own way.
 */

export type DictEntry = { en: string; th: string };

export function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  let out = s;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** A bilingual value (room copy, menu, packages) in the guest's language · English outside TH. */
export function translateEntry(locale: Lang, entry: DictEntry): string {
  if (locale === "th") return entry.th || entry.en;
  const wide = entry as DictEntry & Partial<Record<Lang, string>>;
  return wide[locale] ?? entry.en;
}

/**
 * The Intl tag used for FORMATTING (not for <html lang>). English formats the
 * British way the house always has ("Wed 8 Oct", not "Wed, Oct 8").
 */
export function intlTag(locale: Lang): string {
  return locale === "en" ? "en-GB" : langMeta(locale).tag;
}

/* ── Plurals ─────────────────────────────────────────────────────────────── */

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** "{n} night(s)" in every language · CLDR categories via Intl.PluralRules. */
const NIGHTS: Record<Lang, PluralForms> = {
  en: { one: "{n} night", other: "{n} nights" },
  th: { other: "{n} คืน" },
  zh: { other: "{n} 晚" },
  ja: { other: "{n} 泊" },
  ko: { other: "{n}박" },
  ru: { one: "{n} ночь", few: "{n} ночи", many: "{n} ночей", other: "{n} ночи" },
  de: { one: "{n} Nacht", other: "{n} Nächte" },
  fr: { one: "{n} nuit", other: "{n} nuits" },
  es: { one: "{n} noche", other: "{n} noches" },
  it: { one: "{n} notte", other: "{n} notti" },
  pt: { one: "{n} noite", other: "{n} noites" },
  ar: { zero: "لا ليالي", one: "ليلة واحدة", two: "ليلتان", few: "{n} ليالٍ", many: "{n} ليلة", other: "{n} ليلة" },
  hi: { one: "{n} रात", other: "{n} रातें" },
  id: { other: "{n} malam" },
  vi: { other: "{n} đêm" },
  ms: { other: "{n} malam" },
};

const GUESTS: Record<Lang, PluralForms> = {
  en: { one: "{n} guest", other: "{n} guests" },
  th: { other: "{n} ท่าน" },
  zh: { other: "{n} 位" },
  ja: { other: "{n} 名" },
  ko: { other: "{n}명" },
  ru: { one: "{n} гость", few: "{n} гостя", many: "{n} гостей", other: "{n} гостя" },
  de: { one: "{n} Gast", other: "{n} Gäste" },
  fr: { one: "{n} personne", other: "{n} personnes" },
  es: { one: "{n} huésped", other: "{n} huéspedes" },
  it: { one: "{n} ospite", other: "{n} ospiti" },
  pt: { one: "{n} hóspede", other: "{n} hóspedes" },
  ar: { one: "ضيف واحد", two: "ضيفان", few: "{n} ضيوف", many: "{n} ضيفًا", other: "{n} ضيف" },
  hi: { one: "{n} अतिथि", other: "{n} अतिथि" },
  id: { other: "{n} tamu" },
  vi: { other: "{n} khách" },
  ms: { other: "{n} tetamu" },
};

const rulesCache = new Map<string, Intl.PluralRules>();

function pluralRule(locale: Lang, n: number): Intl.LDMLPluralRule {
  const tag = intlTag(locale);
  let pr = rulesCache.get(tag);
  if (!pr) {
    try {
      pr = new Intl.PluralRules(tag);
    } catch {
      pr = new Intl.PluralRules("en");
    }
    rulesCache.set(tag, pr);
  }
  return pr.select(n);
}

export function plural(locale: Lang, n: number, forms: PluralForms): string {
  const cat = pluralRule(locale, n);
  const s = forms[cat] ?? forms.other;
  return interpolate(s, { n: formatNumber(locale, n) });
}

/** The plural forms of "{n} nights" · handed to the booking bar's script. */
export function nightsForms(locale: Lang): PluralForms {
  return NIGHTS[locale] ?? NIGHTS.en;
}

/** Monday first, except where the week starts on Sunday in common use. */
export function weekStartsOn(locale: Lang): 0 | 1 {
  return locale === "th" || locale === "ja" || locale === "ko" || locale === "zh" || locale === "hi" || locale === "pt" ? 0 : 1;
}

export function nightsLabel(locale: Lang, n: number): string {
  return plural(locale, n, NIGHTS[locale] ?? NIGHTS.en);
}

export function guestsLabel(locale: Lang, n: number): string {
  return plural(locale, n, GUESTS[locale] ?? GUESTS.en);
}

/* ── Numbers and dates ───────────────────────────────────────────────────── */

export function formatNumber(locale: Lang, n: number): string {
  try {
    return new Intl.NumberFormat(intlTag(locale), { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

/**
 * Calendar dates are civil dates, not instants: "2026-10-08" is the 8th
 * wherever the guest is. Noon UTC plus timeZone UTC in the formatter keeps
 * every runtime (server, Bangkok, Los Angeles) on the same day.
 */
function toDate(d: Date | string): Date {
  if (typeof d !== "string") return d;
  return new Date(d.length === 10 ? d + "T12:00:00Z" : d);
}

function civil(d: Date | string): Date {
  if (typeof d === "string") return toDate(d);
  // A local Date (hotelToday(), a picker value) · take its calendar day.
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function dtf(locale: Lang, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(opts)}`;
  let f = dtfCache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(intlTag(locale), { timeZone: "UTC", ...opts });
    } catch {
      f = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
    }
    dtfCache.set(key, f);
  }
  return f;
}

/** "Wed 8 Oct" · weekday, day and short month in the guest's language. */
export function formatDay(locale: Lang, d: Date | string, opts: { year?: boolean } = {}): string {
  return dtf(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(opts.year ? { year: "numeric" } : {}),
  })
    .format(civil(d))
    .replace(/,/g, locale === "en" ? "" : ",");
}

/** "8 Oct" · day and short month, no weekday. */
export function formatShortDay(locale: Lang, d: Date | string, opts: { year?: boolean } = {}): string {
  return dtf(locale, {
    day: "numeric",
    month: "short",
    ...(opts.year ? { year: "numeric" } : {}),
  }).format(civil(d));
}

/** "Wed 8 Oct → Thu 9 Oct" · the one stay-range format. */
export function formatStayRange(locale: Lang, from: Date | string, to: Date | string): string {
  return `${formatDay(locale, from)} → ${formatDay(locale, to)}`;
}

/** "October 2026" · a calendar caption. */
export function formatMonthCaption(locale: Lang, d: Date | string): string {
  return dtf(locale, { month: "long", year: "numeric" }).format(civil(d));
}

/** "W" / "We" · a calendar weekday header. */
export function formatWeekdayShort(locale: Lang, d: Date | string): string {
  return dtf(locale, { weekday: "short" }).format(civil(d));
}

/** "14:00" in the guest's numeral system where they differ. */
export function formatTime(locale: Lang, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  try {
    return new Intl.DateTimeFormat(intlTag(locale), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(d);
  } catch {
    return hhmm;
  }
}

/** "Thursday 9 October 2026" · a confirmation's date, in full. */
export function formatLongDate(locale: Lang, d: Date | string): string {
  const s = dtf(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(civil(d));
  return locale === "en" ? s.replace(/,/g, "") : s;
}
