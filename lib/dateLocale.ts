import type { Locale } from "date-fns";
import {
  ar,
  de,
  es,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  ms,
  ptBR,
  ru,
  th,
  vi,
  zhCN,
} from "date-fns/locale";
import type { Lang } from "@/lib/locales";

/**
 * date-fns locale for the active UI language.
 *
 * A Thai page that says "TUE 13 APR 2027" is still an English page in the part
 * a guest actually reads. The month and weekday names come from date-fns's own
 * locale data, so this is a formatting decision rather than authored copy.
 *
 * Years stay Gregorian on purpose: the property quotes Gregorian years
 * everywhere else (rates, policies, the booking engine), and mixing in
 * Buddhist-era years would be a content decision, not a formatting one.
 */
const MAP: Partial<Record<Lang, Locale>> = {
  th,
  zh: zhCN,
  ja,
  ko,
  ru,
  de,
  fr,
  es,
  it,
  pt: ptBR,
  ar,
  hi,
  id,
  vi,
  ms,
};

export function dfLocale(locale: Lang): { locale: Locale } | undefined {
  const l = MAP[locale];
  return l ? { locale: l } : undefined;
}
