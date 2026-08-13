import { th } from "date-fns/locale";
import type { Lang } from "@/lib/translate";

/**
 * date-fns locale for the active UI language.
 *
 * A Thai page that says "TUE 13 APR 2027" is still an English page in the part
 * a guest actually reads. The month and weekday names come from date-fns's own
 * Thai locale data, so this is a formatting decision rather than authored copy.
 *
 * Years stay Gregorian on purpose: the property quotes Gregorian years
 * everywhere else (rates, policies, the booking engine), and mixing in
 * Buddhist-era years would be a content decision, not a formatting one.
 */
export function dfLocale(locale: Lang) {
  return locale === "th" ? { locale: th } : undefined;
}
